import { NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  try {
    const { blobs } = await list({ prefix: "site-content/" });
    return NextResponse.json({
      files: blobs
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })),
    });
  } catch (err) {
    console.error("Media list failed:", err);
    return NextResponse.json({ files: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.url) {
    return NextResponse.json({ error: "Missing file URL." }, { status: 400 });
  }
  try {
    await del(body.url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Media delete failed:", err);
    return NextResponse.json({ error: "Couldn't delete that file." }, { status: 500 });
  }
}
