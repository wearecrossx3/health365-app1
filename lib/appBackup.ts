import { redis, getJSON, setJSON } from "@/lib/kv";

// The app's progress backup for each user lives at app_state:<id>.
// Every time it is overwritten, the previous copy is kept in a short history
// (app_state_hist:<id>, newest first) so an admin can bring it back if a
// phone ever overwrites good progress with an empty or older one.

export interface SavedState { state: Record<string, unknown>; updatedAt: number }
export interface BackupSummary {
  updatedAt: number; name: string; onboarded: boolean; hasPlan: boolean; planTitle: string;
  weights: number; foodDays: number; trackDays: number; lastActive: string; size: number;
}

export const stateKey = (id: string) => `app_state:${id}`;
const histKey = (id: string) => `app_state_hist:${id}`;
const KEEP = 15;
const SNAP_GAP = 20 * 60 * 1000; // keep at most one history copy per 20 min…

function count(v: unknown) { return v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v as object).length : 0; }
function richness(st: Record<string, unknown>) {
  return (Array.isArray(st.log) ? st.log.length : 0) + count(st.food) + count(st.track) + (st.plan ? 5 : 0);
}

export function summarize(s: SavedState | null): BackupSummary | null {
  if (!s || !s.state) return null;
  const st = s.state;
  const plan = (st.plan || null) as { title?: string; dt?: { title?: string } } | null;
  const days = [...Object.keys((st.food as object) || {}), ...Object.keys((st.track as object) || {})].sort();
  return {
    updatedAt: s.updatedAt,
    name: [st.name, st.last].filter(Boolean).join(" ").trim(),
    onboarded: !!st.onboarded,
    hasPlan: !!plan,
    planTitle: plan ? String(plan.dt?.title || plan.title || "Plan") : "",
    weights: Array.isArray(st.log) ? st.log.length : 0,
    foodDays: count(st.food),
    trackDays: count(st.track),
    lastActive: days[days.length - 1] || "",
    size: JSON.stringify(st).length,
  };
}

// Save a new backup, first copying the old one into history when it is worth keeping.
export async function saveBackup(userId: string, state: Record<string, unknown>): Promise<number> {
  const prev = await getJSON<SavedState>(stateKey(userId));
  if (prev?.state) {
    const r = redis();
    const last = await r.lindex(histKey(userId), 0);
    let lastAt = 0;
    try { lastAt = last ? (JSON.parse(last) as SavedState).updatedAt : 0; } catch { /* ignore */ }
    // …but always keep it when the new copy has less in it (that is the risky case).
    const shrinking = richness(state) < richness(prev.state);
    if (shrinking || prev.updatedAt - lastAt > SNAP_GAP) {
      await r.lpush(histKey(userId), JSON.stringify(prev));
      await r.ltrim(histKey(userId), 0, KEEP - 1);
    }
  }
  const updatedAt = Date.now();
  await setJSON(stateKey(userId), { state, updatedAt });
  return updatedAt;
}

export async function listBackups(userId: string) {
  const [cur, hist] = await Promise.all([
    getJSON<SavedState>(stateKey(userId)),
    redis().lrange(histKey(userId), 0, KEEP - 1),
  ]);
  const older = hist.map((h, i) => { try { return { index: i, ...summarize(JSON.parse(h) as SavedState)! }; } catch { return null; } }).filter(Boolean);
  return { current: summarize(cur), older };
}

// Put an older copy back as the current one. The copy being replaced goes into history too.
export async function restoreBackup(userId: string, index: number): Promise<boolean> {
  const raw = await redis().lindex(histKey(userId), index);
  if (!raw) return false;
  const old = JSON.parse(raw) as SavedState;
  await saveBackup(userId, old.state);
  return true;
}

export async function deleteBackups(userId: string) {
  await redis().del(histKey(userId));
}

// Weights the client logged in the app (newest last), for progress charts.
export async function weightLog(userId: string): Promise<{ d: string; kg: number }[]> {
  const s = await getJSON<SavedState>(stateKey(userId)).catch(() => null);
  const log = s?.state?.log;
  if (!Array.isArray(log)) return [];
  return log
    .map((x) => ({ d: String((x as { d?: unknown }).d || ""), kg: Number((x as { kg?: unknown }).kg) || 0 }))
    .filter((x) => /^\d{4}-\d{2}-\d{2}/.test(x.d) && x.kg > 0)
    .sort((a, b) => (a.d < b.d ? -1 : 1))
    .slice(-60);
}
