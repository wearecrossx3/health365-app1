// A small record of what Health365 sent to each person (emails, WhatsApp),
// so the team can see in Admin › Users exactly what reached a client.
import { redis } from "./kv";

export interface SentItem { at: number; via: "email" | "whatsapp"; what: string; ok: boolean; err?: string }
const key = (to: string) => `sent:${String(to).trim().toLowerCase()}`;

export async function logSent(to: string | string[], item: Omit<SentItem, "at">): Promise<void> {
  try {
    const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (list.length > 3) return; // bulk/admin mails: not per-client
    const r = redis();
    for (const t of list) {
      await r.lpush(key(t), JSON.stringify({ at: Date.now(), ...item }));
      await r.ltrim(key(t), 0, 59);
      await r.expire(key(t), 400 * 24 * 3600);
    }
  } catch { /* logging must never break sending */ }
}

export async function sentTo(...to: string[]): Promise<SentItem[]> {
  const out: SentItem[] = [];
  for (const t of to.filter(Boolean)) {
    const raw = await redis().lrange(key(t), 0, 59).catch(() => [] as string[]);
    for (const x of raw) { try { out.push(JSON.parse(x)); } catch { /* skip */ } }
  }
  return out.sort((a, b) => b.at - a.at);
}
