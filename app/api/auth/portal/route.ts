import { NextRequest, NextResponse } from "next/server";
import { takeHandoff, dietitianStatus } from "@/lib/portalHandoff";
import { getUserById } from "@/lib/kv";
import { createSessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { hostBase } from "@/lib/site";

// One-time link from the main app: signs the dietitian in to the portal
// (or, if not approved yet, to the website so they can apply / see status).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = hostBase(req.headers.get("x-forwarded-host") || req.headers.get("host"), req.nextUrl.protocol.replace(":", "") || "https");
  const h = await takeHandoff(String(req.nextUrl.searchParams.get("code") || ""));
  const u = h ? await getUserById(h.userId).catch(() => null) : null;
  if (!h || !u) return NextResponse.redirect(`${base}/admin/login?expired=1`);
  const value = createSessionCookieValue({ userId: u.id, email: u.email, name: u.name });
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE };
  const st = await dietitianStatus(u.id);
  const res = NextResponse.redirect(`${base}${st.portal ? "/admin/my-clients" : "/join-as-dietitian?app=1"}`);
  res.cookies.set(SESSION_COOKIE_NAME, value, opts);
  if (st.portal) res.cookies.set(ADMIN_SESSION_COOKIE_NAME, value, opts);
  return res;
}
