import crypto from "crypto";
import { redis } from "@/lib/kv";

// Problems the app hit on people's phones (a screen that failed, a crash).
// Same problem = one row with a counter, newest first, last 100 kept.
export interface AppError { id: string; msg: string; stack: string; where: string; version: string; first: number; last: number; count: number; users: number }

export async function recordAppError(e: { msg: string; stack: string; where: string; version: string; device: string }) {
  const r = redis();
  const id = crypto.createHash("sha1").update(e.msg + "|" + e.stack.split("\n").slice(0, 2).join("|")).digest("hex").slice(0, 16);
  const key = `app_err:${id}`;
  const now = Date.now();
  const old = await r.get(key);
  let row: AppError;
  try { row = old ? JSON.parse(old) : null; } catch { row = null as unknown as AppError; }
  const seenKey = `app_err_dev:${id}`;
  const newDevice = (await r.sadd(seenKey, e.device || "x")) === 1;
  await r.expire(seenKey, 60 * 86400);
  row = row
    ? { ...row, last: now, count: row.count + 1, version: e.version || row.version, users: row.users + (newDevice ? 1 : 0) }
    : { id, msg: e.msg, stack: e.stack, where: e.where, version: e.version, first: now, last: now, count: 1, users: 1 };
  await r.set(key, JSON.stringify(row), "EX", 60 * 86400);
  await r.zadd("app_errs", now, id);
  const n = await r.zcard("app_errs");
  if (n > 100) {
    const drop = await r.zrange("app_errs", 0, n - 101);
    if (drop.length) { await r.zrem("app_errs", ...drop); await r.del(...drop.map((d) => `app_err:${d}`)); }
  }
}

export async function listAppErrors(): Promise<AppError[]> {
  const r = redis();
  const ids = await r.zrevrange("app_errs", 0, 49);
  if (!ids.length) return [];
  const raws = await r.mget(...ids.map((i) => `app_err:${i}`));
  return raws.map((x) => { try { return x ? (JSON.parse(x) as AppError) : null; } catch { return null; } }).filter(Boolean) as AppError[];
}

export async function clearAppErrors(id?: string) {
  const r = redis();
  if (id) { await r.zrem("app_errs", id); await r.del(`app_err:${id}`); return; }
  const ids = await r.zrange("app_errs", 0, -1);
  if (ids.length) await r.del(...ids.map((i) => `app_err:${i}`));
  await r.del("app_errs");
}
