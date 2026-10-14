import { redis } from "./kv";

// Small health record for the AI food scanner, shown on the admin dashboard:
// today's successful / failed scans, how many hit the AI provider's limit,
// and the last error — so you can see at a glance if the key ran out.
const day = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export type ScanOutcome = "ok" | "fail" | "quota";

export async function recordScan(outcome: ScanOutcome, detail = ""): Promise<void> {
  try {
    const r = redis();
    const k = `scan_stats:${day()}`;
    await r.hincrby(k, outcome, 1);
    await r.expire(k, 60 * 60 * 24 * 40);
    if (outcome === "ok") await r.set("scan_last_ok", String(Date.now()));
    else await r.set("scan_last_error", JSON.stringify({ at: Date.now(), outcome, detail: detail.slice(0, 300) }));
  } catch {
    /* stats must never break a scan */
  }
}

export interface ScanHealth {
  configured: boolean;
  today: { ok: number; fail: number; quota: number };
  lastOk: number;
  lastError: { at: number; outcome: ScanOutcome; detail: string } | null;
}

export async function getScanHealth(): Promise<ScanHealth> {
  const configured = !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
  try {
    const r = redis();
    const [h, ok, err] = await Promise.all([r.hgetall(`scan_stats:${day()}`), r.get("scan_last_ok"), r.get("scan_last_error")]);
    return {
      configured,
      today: { ok: Number(h?.ok || 0), fail: Number(h?.fail || 0), quota: Number(h?.quota || 0) },
      lastOk: Number(ok || 0),
      lastError: err ? JSON.parse(err) : null,
    };
  } catch {
    return { configured, today: { ok: 0, fail: 0, quota: 0 }, lastOk: 0, lastError: null };
  }
}
