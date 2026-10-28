import { NextRequest, NextResponse } from "next/server";
import { listAllAppointments, Appointment, getUserById } from "@/lib/kv";
import { getMeta, addMessage, chatOpen, paymentPending, firstName, listMessages } from "@/lib/consultChat";
import { sendNotifyToClient } from "@/lib/consultClientNotify";
import { addNotice } from "@/lib/dietitianNotices";
import { dietitianInfo } from "@/lib/portal";
import { sendEmail, emailWrapper } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { listUserPlans } from "@/lib/plans";
import { markAsked, rateLink } from "@/lib/ratings";
import { redis } from "@/lib/kv";

// Runs once a day (Vercel Cron, 10:00 IST — see vercel.json):
//  1. asks clients to rate a consultation the day after it happened;
//  2. reminds dietitians (and tells the owner) about clients waiting > 24 h;
//  3. on Sundays, posts a weekly check-in in active clients' chats.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const istDate = (ms: number) => new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const now = Date.now();
  const today = istDate(now);
  const ago = (days: number) => istDate(now - days * DAY);
  const all = (await listAllAppointments()).filter((a) => a.status === "booked");
  const out = { rated: 0, waiting: 0, checkins: 0 };

  // 1. Rating requests: consultations 1–14 days ago, paid (or free), asked once.
  for (const a of all) {
    if (a.date > ago(1) || a.date < ago(14) || paymentPending(a)) continue;
    const msgs = await listMessages(a.id).catch(() => []);
    if (!msgs.length) continue; // no conversation happened
    if (!(await markAsked(a.id))) continue;
    await addMessage(a.id, "team", `⭐ How was your consultation with ${a.dietitianName}? Please rate it — it takes 10 seconds: ${rateLink(a.id)}`);
    // Email with a tap-able button (links in the app chat may not be clickable).
    const u = await getUserById(a.userId).catch(() => null);
    if (u?.email) {
      await sendEmail({ to: u.email, subject: `How was your consultation with ${a.dietitianName}? ⭐`, html: emailWrapper("How was your consultation?", `<p>Hi ${firstName(u.name)}, we hope your session with ${a.dietitianName} helped.</p><p>Please rate it — it takes 10 seconds and helps others find the right dietitian.</p><p style="margin:22px 0"><a href="${rateLink(a.id)}" style="background:#287379;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Rate my consultation ★★★★★</a></p>`) }).catch(() => {});
    }
    out.rated++;
  }

  // 2. Clients waiting more than 24 hours for a reply.
  const waiting = new Map<string, Appointment[]>();
  for (const a of all) {
    if (!chatOpen(a)) continue;
    const m = await getMeta(a.id);
    if (m.lastFrom !== "client" || !m.lastAt) continue;
    const age = now - m.lastAt;
    if (age < DAY || age > 10 * DAY) continue;
    waiting.set(a.dietitianId, [...(waiting.get(a.dietitianId) || []), a]);
  }
  const summary: string[] = [];
  for (const [dtId, list] of waiting) {
    out.waiting += list.length;
    const names = list.map((a) => firstName(a.userName)).join(", ");
    await addNotice(dtId, { title: `${list.length} client${list.length > 1 ? "s are" : " is"} waiting for your reply`, body: `${names} wrote more than 24 hours ago. Clients expect an answer within 24 hours — please reply in Chats.` }).catch(() => {});
    const d = await dietitianInfo(dtId).catch(() => null);
    if (d?.email) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in";
      await sendEmail({ to: d.email, subject: `${list.length} client${list.length > 1 ? "s" : ""} waiting for your reply — Health365`, html: emailWrapper("Clients are waiting", `<p>Hi ${firstName(d.name)}, ${list.length} client${list.length > 1 ? "s have" : " has"} been waiting more than 24 hours for your reply (${names}).</p><p><a href="${base}/admin/my-clients">Open the H365 Dietitian app</a> to reply.</p>`) }).catch(() => {});
    }
    summary.push(`${d?.name || "Dietitian"} (${list.length})`);
  }
  if (summary.length) {
    await sendPushToAdmins({ title: `${out.waiting} client${out.waiting > 1 ? "s" : ""} waiting > 24 h`, body: summary.join(", "), url: "/admin/consult-chats" }).catch(() => {});
  }

  // 3. Sunday: weekly check-in for clients with an active plan from their dietitian.
  const sunday = new Date(now + 5.5 * 60 * 60 * 1000).getUTCDay() === 0;
  if (sunday) {
    const latest = new Map<string, Appointment>(); // userId|dietitianId -> newest open chat
    for (const a of all) {
      if (!chatOpen(a) || paymentPending(a)) continue;
      const k = `${a.userId}|${a.dietitianId}`;
      const cur = latest.get(k);
      if (!cur || a.date > cur.date) latest.set(k, a);
    }
    for (const a of latest.values()) {
      const plans = await listUserPlans(a.userId).catch(() => []);
      const p = plans.find((x) => x.active && x.byDietitian === a.dietitianId);
      if (!p || now - Date.parse(p.assignedAt) > 90 * DAY || now - Date.parse(p.assignedAt) < 3 * DAY) continue;
      const ok = await redis().set(`checkin:${a.id}:${today}`, "1", "EX", 8 * DAY, "NX");
      if (ok !== "OK") continue;
      await addMessage(a.id, "team", `🗓️ Weekly check-in: please log today's weight in the Health365 app, and tell ${a.dietitianName} here how this week went with your plan — what was easy, what was hard?`);
      await sendNotifyToClient(a, "Your weekly check-in 🗓️").catch(() => {});
      out.checkins++;
    }
  }

  return NextResponse.json({ ok: true, today, ...out });
}
