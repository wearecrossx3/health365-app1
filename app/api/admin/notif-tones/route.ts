import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setNotifTones } from "@/lib/notifTones";

export async function POST(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!(await isAdmin(session, "app-notifications"))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, tones: await setNotifTones(b?.tones || {}) });
}
