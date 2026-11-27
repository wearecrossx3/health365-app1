import { NextRequest, NextResponse } from "next/server";
import { takeHandoff, dietitianStatus } from "@/lib/portalHandoff";
import { getUserById } from "@/lib/kv";
import { createSessionCookieValue, verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { hostBase } from "@/lib/site";

// One-time link from the main app: signs the dietitian in to the portal
// (or, if not approved yet, to the website so they can apply / see status).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = hostBase(req.headers.get("x-forwarded-host") || req.headers.get("host"), req.nextUrl.protocol.replace(":", "") || "https");
  const h = await takeHandoff(String(req.nextUrl.searchParams.get("code") || ""));
  const u = h ? await getUserById(h.userId).catch(() => null) : null;
  if (!h || !u) {
    // The link was already used. This happens when Android reopens the
    // dietitian screen after the app was closed in the background — it
    // replays the same one-time link. If this phone is still signed in,
    // just go back to the portal instead of logging the dietitian out.
    const prev = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value) || verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (prev) {
      const st = await dietitianStatus(prev.userId).catch(() => null);
      if (st?.portal) {
        const res = NextResponse.redirect(`${base}/admin/my-clients`);
        if (!req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value || !verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
          res.cookies.set(ADMIN_SESSION_COOKIE_NAME, createSessionCookieValue({ userId: prev.userId, email: prev.email, name: prev.name }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
        }
        return res;
      }
      if (st) return NextResponse.redirect(`${base}/dietitian-apply`);
    }
    return NextResponse.redirect(`${base}/admin/login?expired=1`);
  }
  const value = createSessionCookieValue({ userId: u.id, email: u.email, name: u.name });
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE };
  const st = await dietitianStatus(u.id);
  const res = NextResponse.redirect(`${base}${st.portal ? "/admin/my-clients" : "/dietitian-apply"}`);
  res.cookies.set(SESSION_COOKIE_NAME, value, opts);
  if (st.portal) res.cookies.set(ADMIN_SESSION_COOKIE_NAME, value, opts);
  return res;
}
