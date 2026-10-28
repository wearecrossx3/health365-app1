import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { listAllUsers, getUserById, getConsultationsForUser, getAppointmentsForUser, getJSON, deleteUserAccount } from "@/lib/kv";
import { getAdminEmails } from "@/lib/email";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getEntitlement, saveEntitlement, listUserPlans, saveUserPlans, AssignedPlan, sevenDayAccess } from "@/lib/plans";
import { listBackups, restoreBackup, weightLog } from "@/lib/appBackup";
import type { PlanDay, PlanMeal } from "@/lib/planGenerator";
import { suggestFromConsultation } from "@/lib/planSuggest";

export const dynamic = "force-dynamic";

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

// Mobile number: from the account, else the latest consultation form, else the
// app's saved profile — older accounts were made before the number was required.
const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);
async function bestPhone(u: { id: string; phone?: string }, consults?: { raw?: Record<string, unknown>; createdAt: string }[]) {
  if (u.phone) return { phone: digits(u.phone) || u.phone, phoneFrom: "account" };
  const cs = consults || (await getConsultationsForUser(u.id).catch(() => []));
  const c = [...cs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).find((x) => digits(x.raw?.phone).length === 10);
  if (c) return { phone: digits(c.raw?.phone), phoneFrom: "consultation" };
  const st = await getJSON<{ state?: { phone?: string } }>(`app_state:${u.id}`).catch(() => null);
  if (st?.state?.phone && digits(st.state.phone).length === 10) return { phone: digits(st.state.phone), phoneFrom: "app" };
  return { phone: "", phoneFrom: "" };
}

// GET            → all users with plan/access summary
// GET ?id=<uid>  → one user with plans, consultations and appointments
export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const [ent, plans, consultations, appointments, backup] = await Promise.all([
      getEntitlement(id), listUserPlans(id), getConsultationsForUser(id).catch(() => []), getAppointmentsForUser(id).catch(() => []),
      listBackups(id).catch(() => ({ current: null, older: [] })),
    ]);
    const latest = [...consultations].sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt))[0];
    const sug = suggestFromConsultation(latest);
    // What the plan maker should keep in mind: from the user's latest consultation form.
    const client = latest ? {
      goal: sug?.goal, diet: sug?.diet, kcal: sug?.kcal || 0, basis: sug?.basis || "",
      conditions: (latest.conditions || []).map(String).filter(Boolean),
      allergens: ((latest as unknown as { allergens?: unknown[] }).allergens || []).map(String).filter(Boolean),
    } : null;
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, ...(await bestPhone(user, consultations)) },
      ent, access: sevenDayAccess(ent), plans, consultations, appointments, backup, suggest: sug, client, weights: await weightLog(id).catch(() => []),
    });
  }
  const users = await listAllUsers();
  const rows = await Promise.all(users.map(async (u) => {
    const [ent, plans, ph] = await Promise.all([getEntitlement(u.id), listUserPlans(u.id), bestPhone(u)]);
    return {
      id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, ...ph,
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

  if (b.action === "restoreBackup") {
    const ok = await restoreBackup(user.id, Math.max(0, Math.floor(Number(b.index) || 0)));
    if (!ok) return NextResponse.json({ error: "That backup copy wasn't found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

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
      assignedBy: txt(b.signedAs, 60) || by,
      assignedAt: now,
      startsOn: /^\d{4}-\d{2}-\d{2}$/.test(String(b.startsOn || "")) ? String(b.startsOn) : "",
      active: true,
    };
    const plans = await listUserPlans(userId);
    // Editing a plan that was already sent: replace it in place (same id,
    // same "from" name, same active state) instead of adding a new one.
    const old = b.replaceId ? plans.find((x) => x.id === String(b.replaceId)) : undefined;
    if (b.replaceId && !old) return NextResponse.json({ error: "That plan wasn't found — it may have been deleted." }, { status: 404 });
    if (old) {
      const upd: AssignedPlan = { ...old, ...plan, id: old.id, createdAt: old.createdAt, assignedAt: old.assignedAt, assignedBy: old.assignedBy, byDietitian: old.byDietitian, active: old.active, note: plan.note || old.note, startsOn: plan.startsOn || old.startsOn, updatedAt: now, editedBy: by } as AssignedPlan;
      await saveUserPlans(userId, plans.map((x) => (x.id === old.id ? upd : x)));
      return NextResponse.json({ ok: true, plan: upd, updated: true });
    }
    // Only one active plan at a time — the newest one is what the app shows.
    await saveUserPlans(userId, [plan, ...plans.map((x) => ({ ...x, active: false }))]);
    const ph = user.phone || (await bestPhone(user)).phone;
    if (ph) {
      sendWhatsAppTemplate({
        to: ph,
        templateName: process.env.WHATSAPP_TEMPLATE_DIETITIAN_PLAN || "health365_dietitian_plan",
        bodyParams: [user.name.split(" ")[0], by],
      }).catch(() => {});
    }
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

  // Permanently delete the account and everything linked to it (same as the
  // user's own "Delete my account"). The admin must type the user's email.
  if (b.action === "deleteUser") {
    if (txt(b.confirm, 200).toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Type the user's email exactly to confirm." }, { status: 400 });
    }
    const protectedEmails = [...getAdminEmails(), session.email].map((e) => (e || "").toLowerCase());
    if (protectedEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "This is an admin account — it can't be deleted from here." }, { status: 400 });
    }
    const removed = await deleteUserAccount(userId);
    console.log(`[admin] ${by} deleted user ${user.email}`);
    return NextResponse.json({ ok: true, removed });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
