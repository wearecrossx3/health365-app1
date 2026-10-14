import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { listAllUsers, getUserById, getConsultationsForUser, getAppointmentsForUser } from "@/lib/kv";
import { getEntitlement, saveEntitlement, listUserPlans, saveUserPlans, AssignedPlan, sevenDayAccess } from "@/lib/plans";
import type { PlanDay, PlanMeal } from "@/lib/planGenerator";

export const dynamic = "force-dynamic";

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

// GET            → all users with plan/access summary
// GET ?id=<uid>  → one user with plans, consultations and appointments
export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const [ent, plans, consultations, appointments] = await Promise.all([
      getEntitlement(id), listUserPlans(id), getConsultationsForUser(id).catch(() => []), getAppointmentsForUser(id).catch(() => []),
    ]);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone || "", createdAt: user.createdAt },
      ent, access: sevenDayAccess(ent), plans, consultations, appointments,
    });
  }
  const users = await listAllUsers();
  const rows = await Promise.all(users.map(async (u) => {
    const [ent, plans] = await Promise.all([getEntitlement(u.id), listUserPlans(u.id)]);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone || "", createdAt: u.createdAt,
      freeUsed: ent.freeUsed, grants: ent.grants, plans: plans.length, access: sevenDayAccess(ent).reason,
    };
  }));
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ users: rows });
}

function cleanMeal(m: Record<string, unknown>): PlanMeal {
  const items = (Array.isArray(m.items) ? m.items : []).slice(0, 10).map((i: Record<string, unknown>) => ({
    name: txt(i.name, 80), portion: txt(i.portion, 40), kcal: num(i.kcal), protein: Math.max(0, Number(i.protein) || 0),
  })).filter((i: { name: string }) => i.name);
  const kcal = items.reduce((s: number, i: { kcal: number }) => s + i.kcal, 0);
  return {
    slot: txt(m.slot, 20) || "meal",
    label: txt(m.label, 30) || "Meal",
    time: txt(m.time, 12),
    title: txt(m.title, 200) || items.map((i: { name: string }) => i.name).join(" + "),
    items,
    kcal: kcal || num(m.kcal),
    protein: Math.round(items.reduce((s: number, i: { protein: number }) => s + i.protein, 0)) || num(m.protein),
    carbs: num(m.carbs), fat: num(m.fat), fibre: num(m.fibre),
    alt: txt(m.alt, 160),
  };
}

export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "users");
  if (!session) return denied();
  const b = await req.json().catch(() => null);
  const userId = txt(b?.userId, 60);
  const user = userId ? await getUserById(userId) : null;
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const by = session.name || session.email;
  const now = new Date().toISOString();

  if (b.action === "grant" || b.action === "revoke" || b.action === "resetFree") {
    const ent = await getEntitlement(userId);
    if (b.action === "grant") {
      const n = Math.min(10, Math.max(1, num(b.count) || 1));
      ent.grants += n;
      ent.grantLog.push({ at: now, by, note: txt(b.note, 120) || `Granted ${n} free 7-day plan${n > 1 ? "s" : ""}`, kind: "grant" });
    } else if (b.action === "revoke") {
      ent.grants = 0;
      ent.grantLog.push({ at: now, by, note: "Removed unused grants", kind: "revoke" });
    } else {
      ent.freeUsed = false;
      ent.freeUsedAt = "";
      ent.grantLog.push({ at: now, by, note: "First free plan made available again", kind: "grant" });
    }
    await saveEntitlement(userId, ent);
    return NextResponse.json({ ok: true, ent, access: sevenDayAccess(ent) });
  }

  if (b.action === "assign") {
    const p = b.plan || {};
    const days: PlanDay[] = (Array.isArray(p.days) ? p.days : []).slice(0, 7).map((d: Record<string, unknown>, i: number) => {
      const meals = (Array.isArray(d.meals) ? d.meals : []).slice(0, 8).map(cleanMeal);
      const t = meals.reduce((a: { kcal: number; protein: number; carbs: number; fat: number; fibre: number }, m: PlanMeal) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat, fibre: a.fibre + m.fibre }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
      return { day: i + 1, label: txt(d.label, 20) || `Day ${i + 1}`, meals, ...t };
    });
    if (!days.length || !days.some((d) => d.meals.length)) return NextResponse.json({ error: "The plan has no meals." }, { status: 400 });
    const plan: AssignedPlan = {
      id: crypto.randomUUID().slice(0, 10),
      userId,
      title: txt(p.title, 100) || `Plan for ${user.name}`,
      goal: p.goal || "better",
      diet: p.diet || "veg",
      region: p.region || "mixed",
      conditions: Array.isArray(p.conditions) ? p.conditions.slice(0, 4) : [],
      targetKcal: num(p.targetKcal) || Math.round(days.reduce((s, d) => s + d.kcal, 0) / days.length),
      days,
      tips: (Array.isArray(p.tips) ? p.tips : []).map((t: unknown) => txt(t, 200)).filter(Boolean).slice(0, 8),
      source: txt(p.source, 120) || "Prepared by your Health365 dietitian",
      createdAt: now,
      note: txt(b.note, 600),
      assignedBy: by,
      assignedAt: now,
      startsOn: /^\d{4}-\d{2}-\d{2}$/.test(String(b.startsOn || "")) ? String(b.startsOn) : "",
      active: true,
    };
    const plans = await listUserPlans(userId);
    // Only one active plan at a time — the newest one is what the app shows.
    await saveUserPlans(userId, [plan, ...plans.map((x) => ({ ...x, active: false }))]);
    return NextResponse.json({ ok: true, plan });
  }

  if (b.action === "deletePlan" || b.action === "activatePlan") {
    const planId = txt(b.planId, 20);
    let plans = await listUserPlans(userId);
    if (b.action === "deletePlan") plans = plans.filter((x) => x.id !== planId);
    else plans = plans.map((x) => ({ ...x, active: x.id === planId }));
    await saveUserPlans(userId, plans);
    return NextResponse.json({ ok: true, plans });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
