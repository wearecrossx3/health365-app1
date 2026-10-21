import { getJSON, setJSON } from "./kv";

// Messages from the Health365 team to one dietitian. They show as a pop-up
// in the Dietitian app and as a phone notification (via the app feed).
export type DtNotice = { id: string; title: string; body: string; at: number; seen?: boolean };
const key = (id: string) => `dt_notices:${id}`;

export async function listNotices(dietitianId: string): Promise<DtNotice[]> {
  return (await getJSON<DtNotice[]>(key(dietitianId))) || [];
}
export async function addNotice(dietitianId: string, n: { title: string; body: string }): Promise<void> {
  const all = await listNotices(dietitianId);
  all.unshift({ id: Math.random().toString(36).slice(2, 10), title: n.title.slice(0, 120), body: n.body.slice(0, 1500), at: Date.now() });
  await setJSON(key(dietitianId), all.slice(0, 30));
}
export async function markNoticesSeen(dietitianId: string, ids: string[]): Promise<void> {
  const all = await listNotices(dietitianId);
  let changed = false;
  for (const n of all) if (ids.includes(n.id) && !n.seen) { n.seen = true; changed = true; }
  if (changed) await setJSON(key(dietitianId), all);
}
