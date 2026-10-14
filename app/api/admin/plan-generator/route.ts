import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { generatePlan, parsePlanInput } from "@/lib/planGenerator";

// Admin → Plan Generator: builds a realistic Indian 7-day (or 1-day) plan.
// Nothing is saved here — the admin reviews/edits it, then assigns it to a
// user from Users & Plans.
export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const b = await req.json().catch(() => null);
  const input = parsePlanInput(b);
  if (input.seed === undefined) input.seed = Math.floor(Math.random() * 1e9);
  return NextResponse.json({ ok: true, plan: generatePlan(input), seed: input.seed });
}
