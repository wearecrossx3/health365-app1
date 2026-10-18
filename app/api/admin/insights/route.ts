import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { markFollowUpDone } from "@/lib/insights";
import { clearAppErrors } from "@/lib/appErrors";

export const dynamic = "force-dynamic";

// POST { action: "followupDone", apptId } | { action: "clearErrors", id? }
export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "dashboard"))) return denied();
  const b = await req.json().catch(() => ({}));
  if (b.action === "followupDone" && b.apptId) { await markFollowUpDone(String(b.apptId).slice(0, 80)); return NextResponse.json({ ok: true }); }
  if (b.action === "clearErrors") { await clearAppErrors(b.id ? String(b.id).slice(0, 40) : undefined); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
