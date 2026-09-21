import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/kv";
import { verifyPassword } from "@/lib/auth";
import { createSessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const payload = { userId: user.id, email: user.email, name: user.name };
    if (!isAdmin({ ...payload, exp: Date.now() + 1 })) {
      // Correct password, but this account isn't on the ADMIN_EMAILS list —
      // don't grant an admin session even though it's a valid site login.
      return NextResponse.json({ error: "This account doesn't have admin access." }, { status: 403 });
    }

    const cookieValue = createSessionCookieValue(payload);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    // Only the admin cookie is set here — a regular h365_session is never
    // created by this route, so admin login stays fully separate from the
    // customer-facing logged-in state.
    res.cookies.set(ADMIN_SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("Admin login failed:", err);
    return NextResponse.json(
      { error: "Couldn't log in — the database isn't connected yet. Check that a Redis store is attached and REDIS_URL is set." },
      { status: 500 }
    );
  }
}
