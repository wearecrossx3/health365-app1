import { NextRequest, NextResponse } from "next/server";
import { dietitianStatus } from "@/lib/portalHandoff";
import { verifySessionCookieValue, createSessionCookieValue, SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { hostBase } from "@/lib/site";

// From the "apply" screen: once the application is approved, opens the
// dietitian portal straight away — no closing the app or logging in again.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = hostBase(req.headers.get("x-forwarded-host") || req.headers.get("host"), req.nextUrl.protocol.replace(":", "") || "https");
  const s = verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!s) return NextResponse.redirect(`${base}/admin/login`);
  const st = await dietitianStatus(s.userId);
  if (!st.portal) return NextResponse.redirect(`${base}/dietitian-apply`);
  const res = NextResponse.redirect(`${base}/admin/my-clients`);
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, createSessionCookieValue({ userId: s.userId, email: s.email, name: s.name }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
