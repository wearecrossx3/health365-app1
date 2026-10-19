import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";
import { getAppt, isChatAppointment, chatOpen, listMessages, addMessage, markRead, saveImage, getMeta, CHAT_OPEN_DAYS } from "@/lib/consultChat";
import { notifyDietitian } from "@/lib/consultNotify";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

async function mine(req: NextRequest, id: string) {
  const s = getAppSession(req);
  if (!s) return { err: appJson({ error: "Please log in again.", code: "auth" }, 401) };
  const a = await getAppt(id);
  if (!a || a.userId !== s.userId || !isChatAppointment(a)) return { err: appJson({ error: "Chat not found." }, 404) };
  return { s, a };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await mine(req, params.id);
  if ("err" in r) return r.err;
  const [messages] = await Promise.all([listMessages(r.a.id), markRead(r.a.id, "client")]);
  return appJson({
    thread: { id: r.a.id, dietitianName: r.a.dietitianName, date: r.a.date, time: r.a.time, open: chatOpen(r.a), openDays: CHAT_OPEN_DAYS },
    messages,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = await limit(req, "cchat-send", 60, 600);
  if (limited) return limited;
  const r = await mine(req, params.id);
  if ("err" in r) return r.err;
  if (!chatOpen(r.a)) return appJson({ error: "This chat has closed. Book a new consultation to continue." }, 400);
  const b = await req.json().catch(() => ({}));
  const text = String(b?.text || "").trim();
  let img: string | undefined;
  if (b?.image) {
    img = (await saveImage(String(b.image))) || undefined;
    if (!img) return appJson({ error: "Couldn't send that photo — please try a smaller one." }, 400);
  }
  if (!text && !img) return appJson({ error: "Type a message first." }, 400);
  const m = await addMessage(r.a.id, "client", text, img);
  notifyDietitian(r.a, await getMeta(r.a.id)).catch(() => {});
  const { orig: _o, ...safe } = m; void _o;
  return appJson({ ok: true, message: safe, masked: !!m.flagged });
}
