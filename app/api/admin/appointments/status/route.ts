import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { updateAppointmentStatus } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!(await isAdmin(session, "dashboard"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id || !["booked", "cancelled"].includes(body?.status)) {
    return NextResponse.json({ error: "Missing appointment id or invalid status." }, { status: 400 });
  }
  await updateAppointmentStatus(body.id, body.status);
  return NextResponse.json({ ok: true });
}
