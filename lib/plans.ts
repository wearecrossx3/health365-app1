import { getJSON, setJSON } from "./kv";
import type { GeneratedPlan } from "./planGenerator";

// Plans the dietitian assigns to a specific user after a paid consultation
// (Admin → Users → Assign plan), plus each user's 7-day-plan access.
//
// Access rules (set by the owner):
//   • 1-day plans are always free, as many times as they like.
//   • The FIRST 7-day plan is free.
//   • After that, 7-day plans are locked in the app. They unlock when the
//     dietitian assigns a plan after a consultation, or when an admin grants
//     a free 7-day plan to that user.

export interface AssignedPlan extends GeneratedPlan {
  id: string;
  userId: string;
  note: string; // dietitian's personal note shown at the top of the plan
  assignedBy: string; // admin name/email
  assignedAt: string;
  startsOn: string; // YYYY-MM-DD (optional)
  active: boolean;
}

export interface Entitlement {
  freeUsed: boolean;
  freeUsedAt: string;
  grants: number; // free 7-day plans granted by admin, not yet used
  grantLog: { at: string; by: string; note: string; kind: "grant" | "use" | "revoke" }[];
}

const plansKey = (userId: string) => `user_plans:${userId}`;
const entKey = (userId: string) => `user_ent:${userId}`;

export const EMPTY_ENT: Entitlement = { freeUsed: false, freeUsedAt: "", grants: 0, grantLog: [] };

export async function getEntitlement(userId: string): Promise<Entitlement> {
  return { ...EMPTY_ENT, ...((await getJSON<Entitlement>(entKey(userId))) || {}) };
}

export async function saveEntitlement(userId: string, e: Entitlement): Promise<void> {
  await setJSON(entKey(userId), { ...e, grantLog: e.grantLog.slice(-50) });
}

export async function listUserPlans(userId: string): Promise<AssignedPlan[]> {
  return (await getJSON<AssignedPlan[]>(plansKey(userId))) || [];
}

export async function saveUserPlans(userId: string, plans: AssignedPlan[]): Promise<void> {
  await setJSON(plansKey(userId), plans.slice(0, 20));
}

// Can this user open a NEW 7-day plan right now?
export function sevenDayAccess(e: Entitlement): { allowed: boolean; reason: "first_free" | "granted" | "locked" } {
  if (!e.freeUsed) return { allowed: true, reason: "first_free" };
  if (e.grants > 0) return { allowed: true, reason: "granted" };
  return { allowed: false, reason: "locked" };
}

// Uses up the first free plan, or one admin grant. Returns false if locked.
export async function consumeSevenDay(userId: string): Promise<{ ok: boolean; ent: Entitlement; used: "first_free" | "granted" | null }> {
  const e = await getEntitlement(userId);
  const now = new Date().toISOString();
  if (!e.freeUsed) {
    e.freeUsed = true;
    e.freeUsedAt = now;
    e.grantLog.push({ at: now, by: "app", note: "First free 7-day plan", kind: "use" });
    await saveEntitlement(userId, e);
    return { ok: true, ent: e, used: "first_free" };
  }
  if (e.grants > 0) {
    e.grants -= 1;
    e.grantLog.push({ at: now, by: "app", note: "Used a granted 7-day plan", kind: "use" });
    await saveEntitlement(userId, e);
    return { ok: true, ent: e, used: "granted" };
  }
  return { ok: false, ent: e, used: null };
}
