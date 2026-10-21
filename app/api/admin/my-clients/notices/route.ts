import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { markNoticesSeen } from "@/lib/dietitianNotices";

// The dietitian closed the team's message pop-up.
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b?.seen) ? b.seen.map(String).slice(0, 30) : [];
  await markNoticesSeen(me.dietitianId, ids);
  return NextResponse.json({ ok: true });
}
