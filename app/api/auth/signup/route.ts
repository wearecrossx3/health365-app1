import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserByEmail, createUser } from "@/lib/kv";
import { hashPassword } from "@/lib/auth";
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, password } = body || {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = {
      id: crypto.randomUUID(),
      email: String(email).toLowerCase(),
      name: String(name),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await createUser(user);

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
    console.error("Signup failed:", err);
    // Most common cause: Vercel KV isn't attached to this project yet,
    // so KV_REST_API_URL / KV_REST_API_TOKEN are missing.
    return NextResponse.json(
      { error: "Couldn't create your account — the database isn't connected yet. Check that a Redis store is attached in Vercel's Storage tab, and that REDIS_URL is set." },
      { status: 500 }
    );
  }
}
