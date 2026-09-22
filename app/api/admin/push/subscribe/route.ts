import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { savePushSubscription, deletePushSubscription } from "@/lib/kv";

async function getSession(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifySessionCookieValue(cookie);
}

function subscriptionId(endpoint: string) {
  return crypto.createHash("sha256").update(endpoint).digest("hex");
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!(await isAdmin(session))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.subscription?.endpoint;
  const keys = body?.subscription?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  await savePushSubscription({
    id: subscriptionId(endpoint),
    email: session!.email,
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!(await isAdmin(session))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });

  await deletePushSubscription(subscriptionId(endpoint));
  return NextResponse.json({ ok: true });
}
