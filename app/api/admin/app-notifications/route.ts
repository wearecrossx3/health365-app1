import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAppNotifications, addAppNotification, deleteAppNotification, AppNotification } from "@/lib/kv";

const AUDIENCES = ["all", "account", "guest", "diabetes", "pcos", "thyroid", "weight", "cholesterol", "digestive", "oncology"];

async function requireAdmin(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  return (await isAdmin(session, "app-notifications")) ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  return NextResponse.json({ notifications: await listAppNotifications() });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim().slice(0, 65);
  const text = String(body?.body || "").trim().slice(0, 240);
  const audience = AUDIENCES.includes(body?.audience) ? body.audience : "all";
  if (!title || !text) return NextResponse.json({ error: "Title and message are both required." }, { status: 400 });
  const n: AppNotification = {
    id: crypto.randomUUID(),
    title,
    body: text,
    audience,
    createdAt: new Date().toISOString(),
    sentBy: session.email,
  };
  await addAppNotification(n);
  return NextResponse.json({ ok: true, notification: n });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await deleteAppNotification(String(body.id));
  return NextResponse.json({ ok: true });
}
