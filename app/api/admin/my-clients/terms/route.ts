import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { getDietitianApplicationById, createOrUpdateDietitianApplication } from "@/lib/kv";
import { TERMS_VERSION } from "@/lib/dietitianTerms";
import { logActivity } from "@/lib/consultChat";

// The dietitian taps "I agree" on the terms in the Dietitian app.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b?.accept !== true) return NextResponse.json({ error: "Please accept the terms." }, { status: 400 });
  const d = await getDietitianApplicationById(me.dietitianId);
  if (!d) return NextResponse.json({ ok: true });
  d.termsAcceptedAt = new Date().toISOString();
  d.termsVersion = TERMS_VERSION;
  await createOrUpdateDietitianApplication(d);
  await logActivity(me.dietitianId, "Accepted the dietitian terms").catch(() => {});
  return NextResponse.json({ ok: true });
}
