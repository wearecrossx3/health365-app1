import crypto from "crypto";
import { put } from "@vercel/blob";
import { redis, getJSON, getAppointmentsForUser, getAppointmentsForDietitian, Appointment } from "./kv";

// In-app consultation chat between a client and a JOINED dietitian (never
// Dr. Astha, who consults by call). One thread per appointment. Phone
// numbers, emails, links and "message me on WhatsApp"-style text are masked
// before anyone sees them, so clients and dietitians can't move off the
// platform. The original text is kept only for the owner.

export const OWN_DIETITIAN = "dr-astha";
export const CHAT_OPEN_DAYS = 30; // chat stays open this many days after the appointment (follow-ups)

export interface ChatMsg {
  id: string;
  from: "client" | "dietitian" | "team";
  text: string;
  img?: string; // image id (served through /api/consult-chat/img)
  at: number;
  flagged?: boolean;
  orig?: string; // unmasked text — owner only
}
export interface ChatMeta { lastAt: number; lastFrom: string; lastText: string; clientRead: number; dtRead: number; flags: number; note: string; outcome: string; dtEmailAt: number; clientEmailAt: number }

const msgsKey = (id: string) => `cchat:${id}`;
const metaKey = (id: string) => `cchat_meta:${id}`;
const imgKey = (id: string) => `cchat_img:${id}`;

export const isChatAppointment = (a: Appointment | null | undefined) => !!a; // every consultation (Dt. Astha too) has a chat

export function chatOpen(a: Appointment): boolean {
  if (a.status !== "booked") return false;
  const end = Date.parse(a.date + "T23:59:59+05:30") + CHAT_OPEN_DAYS * 864e5;
  return Date.now() < end;
}

// ——— Masking ———
const DIGITS: Record<string, string> = {};
"०१२३४५६७८९".split("").forEach((c, i) => (DIGITS[c] = String(i)));
"૦૧૨૩૪૫૬૭૮૯".split("").forEach((c, i) => (DIGITS[c] = String(i)));
const HIDE = "[hidden]";
export function maskContacts(input: string): { text: string; flagged: boolean } {
  let t = String(input || "").replace(/[०-९૦-૯]/g, (c) => DIGITS[c] || c);
  const before = t;
  t = t.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)*\.[a-z]{2,}/gi, HIDE); // emails
  t = t.replace(/[\w.+-]+\s*(\(at\)|\[at\])\s*[\w-]+\s*(\(dot\)|\[dot\]|\.)\s*[a-z]{2,}/gi, HIDE); // "name (at) gmail (dot) com"
  t = t.replace(/\b(https?:\/\/|www\.)\S+/gi, HIDE); // links
  t = t.replace(/\b[\w-]+\.(com|in|net|org|me|io|co|app|link|ly|xyz|site|online)(\/\S*)?\b/gi, HIDE); // bare domains
  t = t.replace(/(\+?\d[\d\s().\-–]{5,}\d)/g, (m) => ((m.match(/\d/g) || []).length >= 7 && !/^\d{1,2}[-.]\d{1,2}[-.]\d{2,4}$/.test(m.trim()) ? HIDE : m)); // phone numbers (not dates)
  t = t.replace(/(^|\s)@[a-z0-9_.]{3,}/gi, `$1${HIDE}`); // @handles
  t = t.replace(/\b(whats\s?app|wa\.me|watsapp|whtsapp|telegram|insta(gram)?|snapchat|facebook|fb\s?id|g\s?pay|google\s?pay|phone\s?pe|paytm|upi(\s?id)?|my\s+(number|no\.?|mobile|contact)|call\s+me|contact\s+me|mobile\s+(no|number))\b/gi, HIDE);
  return { text: t.slice(0, 2000), flagged: t !== before };
}

// ——— Storage ———
export async function getMeta(id: string): Promise<ChatMeta> {
  const m = (await getJSON<Partial<ChatMeta>>(metaKey(id))) || {};
  return { lastAt: 0, lastFrom: "", lastText: "", clientRead: 0, dtRead: 0, flags: 0, note: "", outcome: "", dtEmailAt: 0, clientEmailAt: 0, ...m };
}
async function setMeta(id: string, m: ChatMeta) {
  await redis().set(metaKey(id), JSON.stringify(m));
}

export async function listMessages(id: string, opts: { owner?: boolean } = {}): Promise<ChatMsg[]> {
  const raw = await redis().lrange(msgsKey(id), 0, -1);
  return raw.map((r) => {
    const m = JSON.parse(r) as ChatMsg;
    if (!opts.owner) delete m.orig;
    return m;
  });
}

export async function addMessage(id: string, from: ChatMsg["from"], text: string, img?: string): Promise<ChatMsg> {
  const { text: clean, flagged } = from === "team" ? { text: String(text || "").slice(0, 2000), flagged: false } : maskContacts(text);
  const m: ChatMsg = { id: crypto.randomBytes(6).toString("hex"), from, text: clean, at: Date.now() };
  if (img) m.img = img;
  if (flagged) { m.flagged = true; m.orig = String(text).slice(0, 2000); }
  const r = redis();
  await r.rpush(msgsKey(id), JSON.stringify(m));
  await r.ltrim(msgsKey(id), -600, -1);
  const meta = await getMeta(id);
  meta.lastAt = m.at; meta.lastFrom = from; meta.lastText = clean ? clean.slice(0, 120) : img ? "📷 Photo" : "";
  if (flagged) meta.flags += 1;
  if (from === "client") meta.clientRead = m.at;
  if (from === "dietitian") meta.dtRead = m.at;
  await setMeta(id, meta);
  return m;
}

export async function markRead(id: string, who: "client" | "dietitian") {
  const meta = await getMeta(id);
  if (who === "client") meta.clientRead = Date.now(); else meta.dtRead = Date.now();
  await setMeta(id, meta);
}
export async function updateMeta(id: string, patch: Partial<ChatMeta>) {
  await setMeta(id, { ...(await getMeta(id)), ...patch });
}
export const unreadFor = (meta: ChatMeta, who: "client" | "dietitian") =>
  meta.lastAt > (who === "client" ? meta.clientRead : meta.dtRead) && meta.lastFrom !== who ? 1 : 0;

// ——— Photos ———
// Stored privately: in Vercel Blob under a random name that is never shown to
// anyone (we stream it through our own route after checking who is asking),
// or in Redis as a fallback.
export async function saveImage(dataUrl: string): Promise<string | null> {
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = Buffer.from(m[3], "base64");
  if (buf.length > 1.5 * 1024 * 1024) return null;
  const id = crypto.randomBytes(12).toString("hex");
  let stored: { type: string; url?: string; b64?: string } = { type: m[1], b64: m[3] };
  try {
    const blob = await put(`consult-private/${id}-${crypto.randomBytes(16).toString("hex")}`, buf, { access: "public", contentType: m[1], addRandomSuffix: true });
    stored = { type: m[1], url: blob.url };
  } catch { /* no Blob store here — keep it in Redis */ }
  await redis().set(imgKey(id), JSON.stringify(stored), "EX", 60 * 60 * 24 * 400);
  return id;
}
export async function loadImage(id: string): Promise<{ type: string; body: Buffer } | null> {
  const raw = await redis().get(imgKey(String(id).replace(/[^a-f0-9]/g, "")));
  if (!raw) return null;
  const s = JSON.parse(raw) as { type: string; url?: string; b64?: string };
  if (s.b64) return { type: s.type, body: Buffer.from(s.b64, "base64") };
  if (s.url) {
    const r = await fetch(s.url).catch(() => null);
    if (!r || !r.ok) return null;
    return { type: s.type, body: Buffer.from(await r.arrayBuffer()) };
  }
  return null;
}
export async function threadHasImage(threadId: string, imgId: string) {
  return (await listMessages(threadId)).some((m) => m.img === imgId);
}

// ——— Thread lists ———
export interface ThreadRow { id: string; userId: string; lastFrom: string; clientName: string; dietitianId: string; dietitianName: string; date: string; time: string; status: string; open: boolean; unread: number; lastText: string; lastAt: number; flags: number; outcome: string }

async function rows(appts: Appointment[], who: "client" | "dietitian" | "owner"): Promise<ThreadRow[]> {
  const list = appts.filter(isChatAppointment);
  const metas = await Promise.all(list.map((a) => getMeta(a.id)));
  return list
    .map((a, i) => ({
      id: a.id, userId: who === "client" ? "" : a.userId, clientName: who === "dietitian" ? firstName(a.userName) : a.userName,
      dietitianId: a.dietitianId, dietitianName: a.dietitianName, date: a.date, time: a.time, status: a.status, open: chatOpen(a),
      unread: who === "owner" ? 0 : unreadFor(metas[i], who), lastText: metas[i].lastText, lastFrom: metas[i].lastFrom, lastAt: metas[i].lastAt,
      flags: who === "owner" ? metas[i].flags : 0, outcome: metas[i].outcome,
    }))
    .sort((x, y) => (y.lastAt || Date.parse(y.date)) - (x.lastAt || Date.parse(x.date)));
}
export const firstName = (n: string) => String(n || "Client").trim().split(/\s+/)[0];
export const threadsForClient = async (userId: string) => rows(await getAppointmentsForUser(userId), "client");
export const threadsForDietitian = async (dietitianId: string) => rows(await getAppointmentsForDietitian(dietitianId), "dietitian");
export async function threadsForOwner(all: Appointment[]) { return rows(all, "owner"); }

// ——— Activity log (owner sees what each dietitian did) ———
export async function logActivity(dietitianId: string, what: string) {
  const r = redis();
  await r.lpush(`dt_activity:${dietitianId}`, JSON.stringify({ at: Date.now(), what: what.slice(0, 200) }));
  await r.ltrim(`dt_activity:${dietitianId}`, 0, 199);
}
export async function getActivity(dietitianId: string): Promise<{ at: number; what: string }[]> {
  return (await redis().lrange(`dt_activity:${dietitianId}`, 0, 49)).map((x) => JSON.parse(x));
}

export const getAppt = (id: string) => getJSON<Appointment>(`appointment:${String(id).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60)}`);

// Consultation answers a dietitian may see: no name, phone, email or address,
// and any contact detail inside the answers is masked.
export function safeAnswers(raw: Record<string, unknown> | undefined): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(raw || {})) {
    if (/phone|mobile|email|name|address|whats|contact|city|pin|token|password|utr|source|userid|id$/i.test(k)) continue;
    const val = Array.isArray(v) ? v.join(", ") : typeof v === "object" && v ? JSON.stringify(v) : String(v ?? "");
    if (!val.trim()) continue;
    out.push([k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), maskContacts(val).text.slice(0, 400)]);
  }
  return out.slice(0, 40);
}
