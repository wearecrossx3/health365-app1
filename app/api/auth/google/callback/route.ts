import { NextRequest, NextResponse } from "next/server";
import { googleProfile, userForGoogle, makeAppCode } from "@/lib/googleAuth";
import { siteBase } from "@/lib/resetDelivery";
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getUserByEmail } from "@/lib/kv";
import { getAdminAccess } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = siteBase(req);
  let st: { nonce?: string; app?: boolean; admin?: boolean; next?: string } = {};
  try { st = JSON.parse(req.cookies.get("h365_gstate")?.value || "{}"); } catch { /* ignore */ }
  const code = req.nextUrl.searchParams.get("code");
  const fail = (why: string) => NextResponse.redirect(st.app ? `health365://auth?error=${why}` : `${base}/login?google=${why}`);
  if (!code || !st.nonce || req.nextUrl.searchParams.get("state") !== st.nonce) return fail("cancelled");
  try {
    const prof = await googleProfile(base, code);
    if (!prof) return fail("failed");
    if (st.admin) {
      // Team & Dietitian login: only existing accounts that have admin or dietitian-portal access.
      const u = await getUserByEmail(prof.email);
      const payload = u ? { userId: u.id, email: u.email, name: u.name } : null;
      const access = payload ? await getAdminAccess({ ...payload, exp: Date.now() + 60000 }) : null;
      if (!payload || !access?.allowed) {
        const r = NextResponse.redirect(`${base}/admin/login?google=noaccess`);
        r.cookies.delete("h365_gstate");
        return r;
      }
      const r = NextResponse.redirect(`${base}/admin`);
      r.cookies.set(ADMIN_SESSION_COOKIE_NAME, createSessionCookieValue(payload), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE,
      });
      r.cookies.delete("h365_gstate");
      return r;
    }
    const user = await userForGoogle(prof.email, prof.name, st.app ? "app" : "website");
    let res: NextResponse;
    if (st.app) {
      res = NextResponse.redirect(`health365://auth?code=${await makeAppCode(user)}`);
    } else {
      res = NextResponse.redirect(`${base}${st.next || "/dashboard"}`);
      res.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue({ userId: user.id, email: user.email, name: user.name }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE,
      });
    }
    res.cookies.delete("h365_gstate");
    return res;
  } catch (err) {
    console.error("Google sign-in failed:", err);
    return fail("failed");
  }
}
