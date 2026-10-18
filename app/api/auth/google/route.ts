import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { googleEnabled, googleAuthUrl } from "@/lib/googleAuth";
import { siteBase } from "@/lib/resetDelivery";

// GET /api/auth/google?app=1  → sends the browser to Google's sign-in.
// GET /api/auth/google?status=1 → { enabled }
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (q.get("status")) return NextResponse.json({ enabled: googleEnabled() }, { headers: { "Access-Control-Allow-Origin": "*" } });
  const base = siteBase(req);
  if (!googleEnabled()) return NextResponse.redirect(`${base}/login?google=off`);
  const app = q.get("app") === "1";
  const rawNext = q.get("next") || "/dashboard";
  const next = /^\/(?![\/\\])/.test(rawNext) ? rawNext : "/dashboard";
  const nonce = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(googleAuthUrl(base, nonce));
  res.cookies.set("h365_gstate", JSON.stringify({ nonce, app, next }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
