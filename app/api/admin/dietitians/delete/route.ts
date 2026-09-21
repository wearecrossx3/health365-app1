import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { deleteDietitianApplication } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Missing dietitian id." }, { status: 400 });
  }
  await deleteDietitianApplication(body.id);
  return NextResponse.json({ ok: true });
}
