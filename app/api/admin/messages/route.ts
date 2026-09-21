import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAllContactMessages, markContactMessageRead, deleteContactMessage } from "@/lib/kv";

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  return isAdmin(session);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const messages = await listAllContactMessages();
  return NextResponse.json({ messages });
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id || typeof body?.read !== "boolean") {
    return NextResponse.json({ error: "Missing id or read state." }, { status: 400 });
  }
  await markContactMessageRead(body.id, body.read);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await deleteContactMessage(body.id);
  return NextResponse.json({ ok: true });
}
