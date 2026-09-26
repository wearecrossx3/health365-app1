import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME, SessionPayload } from "./session";
import { isRateLimited } from "./kv";

// Shared helpers for the Health365 Android app's API (/api/app/*).
//
// The app is not a browser tab on this domain, so it can't rely on the
// h365_session cookie. Instead, login/signup return the SAME signed
// session value as a token, and the app sends it back as
// "Authorization: Bearer <token>". Nothing new to secure: it's verified
// with the exact same HMAC check as the website cookie.
//
// CORS is open ("*") only on these /api/app routes. That's safe because
// they never read cookies for anything sensitive when called cross-site
// (browsers don't send cookies with "*" CORS) — auth is the bearer token.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

export function appJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export function appPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function getAppSession(req: NextRequest): SessionPayload | null {
  const header = req.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return verifySessionCookieValue(bearer || req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.ip || "unknown";
}

// Returns a ready 429 response when this IP has made too many calls to
// `bucket` in the window, otherwise null.
export async function limit(req: NextRequest, bucket: string, max: number, windowSeconds: number) {
  if (await isRateLimited(`${bucket}:${clientIp(req)}`, max, windowSeconds)) {
    return appJson({ error: "Too many requests — please wait a minute and try again." }, 429);
  }
  return null;
}

export function str(v: unknown, max = 500): string {
  return String(v ?? "").trim().slice(0, max);
}
