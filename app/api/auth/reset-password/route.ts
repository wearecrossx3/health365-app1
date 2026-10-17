import { NextRequest, NextResponse } from "next/server";
import { checkResetLink, useResetLink } from "@/lib/passwordReset";
import { isRateLimited } from "@/lib/kv";

export const dynamic = "force-dynamic";

const ip = (req: NextRequest) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "x";

// GET ?t=token → is this link still valid?
export async function GET(req: NextRequest) {
  if (await isRateLimited(`pwreset:${ip(req)}`, 40, 3600)) return NextResponse.json({ ok: false }, { status: 429 });
  const info = await checkResetLink(req.nextUrl.searchParams.get("t"));
  return info ? NextResponse.json({ ok: true, ...info }) : NextResponse.json({ ok: false }, { status: 404 });
}

// POST { t, password } → set the new password (link then stops working)
export async function POST(req: NextRequest) {
  if (await isRateLimited(`pwreset:${ip(req)}`, 40, 3600)) {
    return NextResponse.json({ error: "Too many tries — please wait a while and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "That password is too long." }, { status: 400 });
  const ok = await useResetLink(body.t, password);
  if (!ok) return NextResponse.json({ error: "This link has expired or was already used. Ask us for a new one." }, { status: 410 });
  return NextResponse.json({ ok: true });
}
