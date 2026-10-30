import { redis, getJSON, setJSON, deleteAppointment, getUserById } from "./kv";
import type { Appointment } from "./kv";
import type { Rating } from "./ratings";
import type { DtNotice } from "./dietitianNotices";
import { isAdmin } from "./admin";
import { getDietitianApplicationByUserId } from "./kv";

// Remove a booking completely — the appointment, its chat, rating, the
// daily-job markers, and the pop-up notices it caused for the dietitian.
// Used to clean out test bookings.
export async function purgeBooking(id: string): Promise<boolean> {
  const r = redis();
  const a = await getJSON<Appointment>(`appointment:${id}`);
  await deleteAppointment(id);
  await r.del(`cchat:${id}`, `cchat_meta:${id}`, `rating:${id}`, `rating_asked:${id}`);
  const marks = await r.keys(`checkin:${id}:*`).catch(() => [] as string[]);
  if (marks.length) await r.del(...marks);
  if (!a) return false;
  const rl = (await getJSON<Rating[]>(`dt_ratings:${a.dietitianId}`)) || [];
  if (rl.some((x) => x.apptId === id)) await setJSON(`dt_ratings:${a.dietitianId}`, rl.filter((x) => x.apptId !== id));
  // Dietitian pop-ups about this client ("waiting for your reply", "new rating"…)
  const first = String(a.userName || "").trim().split(/\s+/)[0];
  const notes = (await getJSON<DtNotice[]>(`dt_notices:${a.dietitianId}`)) || [];
  if (first && notes.length) {
    const keep = notes.filter((n) => !(/waiting for your reply|rating/i.test(n.title) && n.body.includes(first)));
    if (keep.length !== notes.length) await setJSON(`dt_notices:${a.dietitianId}`, keep);
  }
  return true;
}

// Bookings made by the Health365 team or a dietitian themselves are tests:
// the daily job leaves them alone (no rating asks, reminders or check-ins).
const cache = new Map<string, boolean>();
export async function isTeamBooking(a: Appointment): Promise<boolean> {
  if (cache.has(a.userId)) return cache.get(a.userId)!;
  let team = false;
  const u = await getUserById(a.userId).catch(() => null);
  if (u) {
    team = await isAdmin({ userId: u.id, email: u.email, name: u.name, exp: Date.now() + 60_000 }).catch(() => false);
    if (!team) team = !!(await getDietitianApplicationByUserId(u.id).catch(() => null));
  }
  cache.set(a.userId, team);
  return team;
}
