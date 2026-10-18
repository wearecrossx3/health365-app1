import { redis, listAllUsers, listAllAppointments, listAllConsultations, getUserById } from "@/lib/kv";

// Lightweight usage stats for the admin "Insights" page. The app pings once
// when it opens (device id is a random number made on the phone, never the
// phone's real ID). Kept for ~100 days.
const TTL = 100 * 86400;
const day = (d: Date) => d.toISOString().slice(0, 10);
const ist = (ms = Date.now()) => new Date(ms + 5.5 * 3600 * 1000); // count days in India time

export async function recordPing(did: string, uid: string, version: string) {
  const r = redis();
  const d = day(ist());
  const p = r.pipeline();
  p.sadd(`act:${d}`, did).expire(`act:${d}`, TTL);
  p.pfadd("devices_all", did);
  if (version) p.hset("dev_ver", did, version);
  if (uid) {
    p.sadd(`actu:${d}`, uid).expire(`actu:${d}`, TTL);
    p.hset("user_lastseen", uid, String(Date.now()));
  }
  await p.exec();
}

export interface Insights {
  days: { date: string; active: number; signups: number; consults: number }[];
  dau: number; wau: number; mau: number; installs: number;
  versions: { version: string; devices: number }[];
  inactive: { id: string; name: string; email: string; phone: string; lastSeen: number }[];
  totals: { users: number; consults: number; appts: number };
}

export async function getInsights(): Promise<Insights> {
  const r = redis();
  const N = 30;
  const dates = Array.from({ length: N }, (_, i) => day(ist(Date.now() - (N - 1 - i) * 86400000)));
  const [counts, users, consults, appts, installs, vers, seen] = await Promise.all([
    Promise.all(dates.map((d) => r.scard(`act:${d}`))),
    listAllUsers(),
    listAllConsultations().catch(() => []),
    listAllAppointments().catch(() => []),
    r.pfcount("devices_all"),
    r.hvals("dev_ver"),
    r.hgetall("user_lastseen"),
  ]);
  const by = (arr: { createdAt: string }[]) => {
    const m: Record<string, number> = {};
    for (const x of arr) { const k = day(ist(new Date(x.createdAt).getTime())); m[k] = (m[k] || 0) + 1; }
    return m;
  };
  const su = by(users), co = by(consults);
  const wau = dates.length ? await r.sunion(...dates.slice(-7).map((d) => `act:${d}`)).then((x) => x.length) : 0;
  const mau = await r.sunion(...dates.map((d) => `act:${d}`)).then((x) => x.length);
  const vc: Record<string, number> = {};
  for (const v of vers) vc[v] = (vc[v] || 0) + 1;
  const weekAgo = Date.now() - 7 * 86400000;
  const inactive = Object.entries(seen)
    .map(([id, t]) => ({ id, t: Number(t) }))
    .filter((x) => x.t < weekAgo)
    .sort((a, b) => b.t - a.t)
    .slice(0, 40);
  const uMap = new Map(users.map((u) => [u.id, u]));
  return {
    days: dates.map((d, i) => ({ date: d, active: counts[i], signups: su[d] || 0, consults: co[d] || 0 })),
    dau: counts[counts.length - 1] || 0, wau, mau, installs,
    versions: Object.entries(vc).map(([version, devices]) => ({ version, devices })).sort((a, b) => b.devices - a.devices).slice(0, 8),
    inactive: inactive.filter((x) => uMap.has(x.id)).map((x) => { const u = uMap.get(x.id)!; return { id: u.id, name: u.name, email: u.email, phone: u.phone || "", lastSeen: x.t }; }),
    totals: { users: users.length, consults: consults.length, appts: appts.filter((a) => a.status !== "cancelled").length },
  };
}

// ---- Follow-ups: people whose consultation was 7–30 days ago and who have
// not booked again — a nudge for the dietitian to check in.
export async function getFollowUps() {
  const r = redis();
  const appts = await listAllAppointments().catch(() => []);
  const done = new Set(await r.smembers("followup_done"));
  const today = day(ist());
  const ago = (n: number) => day(ist(Date.now() - n * 86400000));
  const latest = new Map<string, (typeof appts)[number]>();
  for (const a of appts) {
    if (a.status === "cancelled") continue;
    const cur = latest.get(a.userId);
    if (!cur || a.date > cur.date) latest.set(a.userId, a);
  }
  const due = [...latest.values()].filter((a) => a.date <= ago(7) && a.date >= ago(30) && a.date < today && !done.has(a.id));
  due.sort((a, b) => (a.date < b.date ? -1 : 1));
  return Promise.all(due.slice(0, 40).map(async (a) => {
    const u = await getUserById(a.userId).catch(() => null);
    const days = Math.round((Date.parse(today) - Date.parse(a.date)) / 86400000);
    return { apptId: a.id, userId: a.userId, name: u?.name || a.userName, phone: u?.phone || "", email: u?.email || "", dietitian: a.dietitianName, date: a.date, days };
  }));
}

export async function markFollowUpDone(apptId: string) {
  await redis().sadd("followup_done", apptId);
}
