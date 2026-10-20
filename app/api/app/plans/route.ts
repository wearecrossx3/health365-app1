import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";
import { getEntitlement, listUserPlans, sevenDayAccess, consumeSevenDay } from "@/lib/plans";

// The signed-in user's plans from their dietitian + their 7-day plan access.
//   GET  → { access, grants, freeUsed, activePlan, plans[] }
//   POST { action: "claim" } → uses the first free 7-day plan (or one admin
//        grant) right before the app builds a new 7-day plan. 403 when locked.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  try {
    const [ent, plans] = await Promise.all([getEntitlement(session.userId), listUserPlans(session.userId)]);
    // Never show a team member's email as "sent by" in the app.
    const who = (b: string) => (/@/.test(b || "") ? "Your dietitian" : b);
    const found = plans.find((p) => p.active);
    const active = found ? { ...found, assignedBy: who(found.assignedBy) } : null;
    return appJson({
      access: sevenDayAccess(ent),
      freeUsed: ent.freeUsed,
      grants: ent.grants,
      activePlan: active,
      plans: plans.map((p) => ({ id: p.id, title: p.title, assignedAt: p.assignedAt, assignedBy: who(p.assignedBy), active: p.active, targetKcal: p.targetKcal })),
    });
  } catch (err) {
    console.error("App plans failed:", err);
    return appJson({ error: "Couldn't load your plans right now." }, 500);
  }
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-plan-claim", 30, 3600);
  if (limited) return limited;
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const b = await req.json().catch(() => null);
  if (b?.action !== "claim") return appJson({ error: "Unknown action." }, 400);
  const r = await consumeSevenDay(session.userId);
  if (!r.ok) return appJson({ error: "Your free 7-day plan is already used.", code: "locked", access: sevenDayAccess(r.ent) }, 403);
  return appJson({ ok: true, used: r.used, access: sevenDayAccess(r.ent), grants: r.ent.grants });
}
