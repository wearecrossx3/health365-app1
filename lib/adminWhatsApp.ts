import { redis } from "./kv";

// Free WhatsApp alerts to the OWNER/ADMINS' own phones via CallMeBot.
// Each admin activates it once from their own WhatsApp (they send
// "I allow callmebot to send me messages" to the CallMeBot number and get an
// API key back), then adds number + key in Admin → Dashboard.
// It can only message numbers that activated it themselves, so it is for
// team alerts (new member, booking…), never for customers.

export interface AlertPhone { phone: string; apikey: string; name: string; addedAt: string }
export interface AlertHealth { lastOk: string; lastError: { at: string; error: string } | null }

const KEY = "cmb_alerts";

export async function listAlertPhones(): Promise<AlertPhone[]> {
  try { return JSON.parse((await redis().get(KEY)) || "[]"); } catch { return []; }
}
export async function saveAlertPhones(list: AlertPhone[]) {
  await redis().set(KEY, JSON.stringify(list.slice(0, 5)));
}
export async function alertHealth(): Promise<AlertHealth> {
  const r = redis();
  const [ok, er] = await Promise.all([r.get("cmb_last_ok").catch(() => null), r.get("cmb_last_error").catch(() => null)]);
  let lastError = null;
  try { lastError = er ? JSON.parse(er) : null; } catch { /* ignore */ }
  return { lastOk: ok || "", lastError };
}

export function cleanPhone(p: string): string {
  const d = String(p || "").replace(/[^\d]/g, "");
  return d.length === 10 ? `91${d}` : d;
}

async function sendOne(p: AlertPhone, text: string): Promise<string> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${p.phone}&text=${encodeURIComponent(text.slice(0, 900))}&apikey=${encodeURIComponent(p.apikey)}`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 9000);
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    clearTimeout(t);
    const body = (await res.text().catch(() => "")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (res.ok && !/error|invalid|not\s+activated|wrong/i.test(body.slice(0, 300))) return "";
    return body.slice(0, 200) || `HTTP ${res.status}`;
  } catch {
    return "Couldn't reach CallMeBot";
  }
}

// Sends to every saved admin phone. Never throws.
export async function sendAdminWhatsApp(text: string, only?: string): Promise<{ sent: number; errors: string[] }> {
  const list = (await listAlertPhones()).filter((p) => !only || p.phone === only);
  const errors: string[] = [];
  let sent = 0;
  for (const p of list) {
    const err = await sendOne(p, text);
    if (err) errors.push(`${p.name || p.phone}: ${err}`);
    else sent++;
  }
  try {
    const r = redis();
    if (sent) await r.set("cmb_last_ok", new Date().toISOString());
    if (errors.length) await r.set("cmb_last_error", JSON.stringify({ at: new Date().toISOString(), error: errors[0] }));
  } catch { /* stats are best-effort */ }
  return { sent, errors };
}
