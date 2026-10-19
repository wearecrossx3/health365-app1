import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { getAppt, isChatAppointment, chatOpen, listMessages, addMessage, markRead, saveImage, getMeta, updateMeta, safeAnswers, firstName, logActivity } from "@/lib/consultChat";
import { getConsultationsForUser, getUserById } from "@/lib/kv";
import { dietitianInfo } from "@/lib/portal";
import { suggestFromConsultation } from "@/lib/planSuggest";
import { listUserPlans, saveUserPlans, AssignedPlan } from "@/lib/plans";
import { sendNotifyToClient } from "@/lib/consultClientNotify";

export const dynamic = "force-dynamic";

async function load(req: NextRequest, id: string) {
  const me = await dietitianFromRequest(req);
  if (!me) return { err: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  const a = await getAppt(id);
  // Only this dietitian's own bookings — never anyone else's client.
  if (!a || a.dietitianId !== me.dietitianId || !isChatAppointment(a)) return { err: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  return { me, a };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await load(req, params.id);
  if ("err" in r) return r.err;
  const { a, me } = r;
  const [msgs, meta, consults, plans] = await Promise.all([listMessages(a.id), getMeta(a.id), getConsultationsForUser(a.userId), listUserPlans(a.userId)]);
  await markRead(a.id, "dietitian");
  const c = consults.sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt))[0];
  await logActivity(me.dietitianId, `Opened chat with ${firstName(a.userName)} (${a.date})`);
  return NextResponse.json({
    thread: { id: a.id, client: firstName(a.userName), date: a.date, time: a.time, status: a.status, open: chatOpen(a), note: meta.note, outcome: meta.outcome },
    suggest: suggestFromConsultation(c),
    profile: c ? { goal: c.goal, diet: c.dietType, conditions: c.conditions, allergens: c.allergens, answers: safeAnswers(c.raw), at: c.createdAt } : null,
    plans: plans.filter((p) => p.byDietitian === me.dietitianId).map((p) => ({ id: p.id, title: p.title, at: p.assignedAt, active: p.active, targetKcal: p.targetKcal, plan: { title: p.title, goal: p.goal, diet: p.diet, region: p.region, conditions: p.conditions, targetKcal: p.targetKcal, days: p.days, tips: p.tips, source: p.source } })),
    messages: msgs,
  });
}

const txt = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await load(req, params.id);
  if ("err" in r) return r.err;
  const { a, me } = r;
  const b = await req.json().catch(() => ({}));

  if (b.action === "send") {
    if (!chatOpen(a)) return NextResponse.json({ error: "This chat has closed." }, { status: 400 });
    const text = txt(b.text, 2000);
    let img: string | undefined;
    if (b.image) {
      img = (await saveImage(String(b.image))) || undefined;
      if (!img) return NextResponse.json({ error: "Couldn't send that photo — try a smaller one." }, { status: 400 });
    }
    if (!text && !img) return NextResponse.json({ error: "Type a message first." }, { status: 400 });
    const m = await addMessage(a.id, "dietitian", text, img);
    await logActivity(me.dietitianId, `Messaged ${firstName(a.userName)}${m.flagged ? " (contact details were hidden)" : ""}`);
    sendNotifyToClient(a).catch(() => {});
    const { orig: _o, ...safe } = m; void _o;
    return NextResponse.json({ ok: true, message: safe, masked: !!m.flagged });
  }
  if (b.action === "note") {
    await updateMeta(a.id, { note: txt(b.note, 2000) });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "outcome") {
    const o = ["", "done", "no-show", "follow-up"].includes(b.outcome) ? b.outcome : "";
    await updateMeta(a.id, { outcome: o });
    await logActivity(me.dietitianId, `Marked ${firstName(a.userName)} as ${o || "open"}`);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "assign") {
    const user = await getUserById(a.userId);
    const d = await dietitianInfo(me.dietitianId);
    if (!user || !d.name) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const p = b.plan || {};
    const days = (Array.isArray(p.days) ? p.days : []).slice(0, 7);
    if (JSON.stringify(days).length > 150000) return NextResponse.json({ error: "Plan is too large." }, { status: 400 });
    const dayK = (d: { kcal?: number }) => Number(d?.kcal) || 0;
    if (!Number(p.targetKcal) && days.length) p.targetKcal = Math.round(days.reduce((s2: number, d: { kcal?: number }) => s2 + dayK(d), 0) / days.length);
    if (!days.length) return NextResponse.json({ error: "The plan has no meals." }, { status: 400 });
    const now = new Date().toISOString();
    const plan: AssignedPlan = {
      id: crypto.randomUUID().slice(0, 10), userId: user.id,
      title: txt(p.title, 100) || `Plan for ${firstName(user.name)}`,
      goal: p.goal || "better", diet: p.diet || "veg", region: p.region || "mixed",
      conditions: Array.isArray(p.conditions) ? p.conditions.slice(0, 4) : [],
      targetKcal: Number(p.targetKcal) || 0, days,
      tips: (Array.isArray(p.tips) ? p.tips : []).map((t: unknown) => txt(t, 200)).filter(Boolean).slice(0, 8),
      source: `Prepared by ${d.name}`, createdAt: now,
      note: txt(b.note, 600), assignedBy: d.name, byDietitian: me.dietitianId, assignedAt: now,
      startsOn: /^\d{4}-\d{2}-\d{2}$/.test(String(b.startsOn || "")) ? String(b.startsOn) : "", active: true,
    };
    const plans = await listUserPlans(user.id);
    await saveUserPlans(user.id, [plan, ...plans.map((x) => ({ ...x, active: false }))]);
    await addMessage(a.id, "team", `📋 ${d.name} sent you a new diet plan. Open the Plan tab to see it.`);
    await logActivity(me.dietitianId, `Assigned a plan to ${firstName(user.name)}`);
    sendNotifyToClient(a, "Your dietitian sent you a new diet plan 📋").catch(() => {});
    return NextResponse.json({ ok: true, plan: { id: plan.id, title: plan.title } });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
