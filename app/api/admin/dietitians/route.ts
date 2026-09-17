import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setDietitianStatus } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id || !["approved", "rejected", "pending"].includes(body?.status)) {
    return NextResponse.json({ error: "Missing id or invalid status." }, { status: 400 });
  }
  await setDietitianStatus(body.id, body.status);
  return NextResponse.json({ ok: true });
}
