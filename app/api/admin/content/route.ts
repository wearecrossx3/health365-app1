import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getSiteContent, setSiteContent, SiteContent } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Missing content." }, { status: 400 });
  }
  const current = await getSiteContent();
  const updated: SiteContent = { ...current, ...body };
  await setSiteContent(updated);
  return NextResponse.json({ ok: true, content: updated });
}
