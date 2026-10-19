import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { generatePlan, parsePlanInput } from "@/lib/planGenerator";

// Plan generator for the dietitian portal (same engine as the owner's).
export async function POST(req: NextRequest) {
  if (!(await dietitianFromRequest(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const input = parsePlanInput(await req.json().catch(() => null));
  if (input.seed === undefined) input.seed = Math.floor(Math.random() * 1e9);
  return NextResponse.json({ ok: true, plan: generatePlan(input), seed: input.seed });
}
