import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getUserById, createUser, isRateLimited } from "@/lib/kv";
import { hashPassword, verifyPassword } from "@/lib/auth";

// A signed-in person (website or team/dietitian login) sets or changes their
// password. People who joined with Google don't know a password, so they can
// set one without the current one — that lets them log in to the apps,
// where Google sign-in isn't allowed.
export async function GET(req: NextRequest) {
  const s = who(req);
  if (!s) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const u = await getUserById(s.userId);
  return NextResponse.json({ google: !!u?.google });
}

export async function POST(req: NextRequest) {
  const s = who(req);
  if (!s) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (await isRateLimited(`setpw:${s.userId}`, 8, 3600)) return NextResponse.json({ error: "Too many tries. Please wait a while." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const password = String(b?.password || "");
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "That password is too long." }, { status: 400 });
  const u = await getUserById(s.userId);
  if (!u) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!u.google && !verifyPassword(String(b?.current || ""), u.passwordHash)) {
    return NextResponse.json({ error: "Your current password is wrong.", code: "current" }, { status: 400 });
  }
  u.passwordHash = hashPassword(password);
  await createUser(u);
  return NextResponse.json({ ok: true });
}

function who(req: NextRequest) {
  return verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)
    || verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}
