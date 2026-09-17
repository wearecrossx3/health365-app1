import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/kv";
import { verifyPassword } from "@/lib/auth";
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

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

    const cookieValue = createSessionCookieValue({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    res.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("Login failed:", err);
    return NextResponse.json(
      { error: "Couldn't log in — the database isn't connected yet. Check that a Redis store is attached and REDIS_URL is set." },
      { status: 500 }
    );
  }
}
