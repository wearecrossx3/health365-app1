import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminGuard";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/planTemplates";

// Plan templates: admins share one "team" list; each dietitian has their own
// list and can also start from the team's templates (read-only).
export const dynamic = "force-dynamic";

async function who(req: NextRequest): Promise<{ owner: string; by: string; canTeam: boolean } | null> {
  const admin = await adminFromRequest(req, "users");
  if (admin) return { owner: "team", by: admin.name || admin.email, canTeam: true };
  const dt = await dietitianFromRequest(req);
  if (dt) return { owner: `dt:${dt.dietitianId}`, by: dt.session.name || "Dietitian", canTeam: false };
  return null;
}

const strip = (p: Record<string, unknown>) => {
  const s = JSON.stringify(p || {});
  if (s.length > 150000) return null;
  // Drop editing-only data (per-item food base values) and personal bits.
  const plan = JSON.parse(s.replace(/,"_b":\{[^}]*\}/g, ""));
  return { title: plan.title, goal: plan.goal, diet: plan.diet, region: plan.region, conditions: plan.conditions, targetKcal: plan.targetKcal, days: plan.days, tips: plan.tips, source: plan.source };
};

export async function GET(req: NextRequest) {
  const w = await who(req);
  if (!w) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const mine = await listTemplates(w.owner);
  const team = w.owner === "team" ? [] : await listTemplates("team");
  return NextResponse.json({
    mine: mine.map((t) => ({ id: t.id, name: t.name, savedAt: t.savedAt, by: t.by, plan: t.plan })),
    team: team.map((t) => ({ id: t.id, name: t.name, savedAt: t.savedAt, by: t.by, plan: t.plan })),
  });
}

export async function POST(req: NextRequest) {
  const w = await who(req);
  if (!w) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b.action === "delete") {
    await deleteTemplate(w.owner, String(b.id || ""));
    return NextResponse.json({ ok: true });
  }
  const plan = strip(b.plan);
  if (!plan || !Array.isArray(plan.days) || !plan.days.length) return NextResponse.json({ error: "This plan is empty or too large to save." }, { status: 400 });
  const t = await saveTemplate(w.owner, String(b.name || "").trim(), w.by, plan);
  return NextResponse.json({ ok: true, template: { id: t.id, name: t.name } });
}
