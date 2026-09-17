import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: session.userId, email: session.email, name: session.name } });
}
