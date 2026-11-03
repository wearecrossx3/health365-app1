import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { generatePlan, parsePlanInput } from "@/lib/planGenerator";
import { getAppt, isPaid } from "@/lib/consultChat";

// Plan generator for the dietitian portal (same engine as the owner's).
export async function POST(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  // Plans are only for this dietitian's own, paid clients.
  const a = await getAppt(String(req.nextUrl.searchParams.get("for") || ""));
  if (!a || a.dietitianId !== me.dietitianId) return NextResponse.json({ error: "Open a client first, then make their plan." }, { status: 400 });
  if (!isPaid(a)) return NextResponse.json({ error: "You can make a plan after Health365 confirms this client’s payment." }, { status: 400 });
  const input = parsePlanInput(await req.json().catch(() => null));
  if (input.seed === undefined) input.seed = Math.floor(Math.random() * 1e9);
  return NextResponse.json({ ok: true, plan: generatePlan(input), seed: input.seed });
}
