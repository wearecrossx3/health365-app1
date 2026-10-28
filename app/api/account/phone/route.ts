import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { setUserPhone } from "@/lib/kv";

// Website: a signed-in user adds or changes the mobile number on their account.
export async function POST(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const r = await setUserPhone(session.userId, String(b?.phone || ""));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, phone: r.phone });
}
