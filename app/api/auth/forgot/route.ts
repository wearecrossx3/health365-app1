import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUserById, getUserIdByPhone, isRateLimited } from "@/lib/kv";
import { sendResetLink, siteBase, canSendResetLinks } from "@/lib/resetDelivery";
import { limit, CORS_HEADERS } from "@/lib/appApi";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

// Self-serve "Forgot password": the user types their email or mobile number
// and we send a one-time reset link by email / WhatsApp (whichever is set up).
// The answer is the same whether or not an account exists, so nobody can use
// this to find out who has an account.
//   GET  → { available } — false when neither email nor WhatsApp is set up yet
//   POST { id } → { ok }
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const ch = canSendResetLinks();
  return NextResponse.json({ available: ch.email || ch.whatsapp, email: ch.email, whatsapp: ch.whatsapp }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "forgot", 5, 3600);
  if (limited) return limited;
  const ch = canSendResetLinks();
  if (!ch.email && !ch.whatsapp) return NextResponse.json({ error: "off", code: "off" }, { status: 503, headers: CORS_HEADERS });
  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? "").trim().toLowerCase().slice(0, 120);
  if (!id) return NextResponse.json({ error: "Please enter your email or mobile number." }, { status: 400, headers: CORS_HEADERS });
  try {
    let user = null;
    if (id.includes("@")) user = await getUserByEmail(id);
    else {
      const ph = normalizePhone(id);
      const uid = ph ? await getUserIdByPhone(ph) : null;
      user = uid ? await getUserById(uid) : null;
    }
    if (user) {
      // one link per account per 10 minutes, even across different IPs
      if (!(await isRateLimited(`forgot-acct:${user.id}`, 1, 600))) await sendResetLink(user, siteBase(req), "self");
    }
    return NextResponse.json({ ok: true, email: ch.email, whatsapp: ch.whatsapp }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Forgot password failed:", err);
    return NextResponse.json({ error: "Couldn't send right now — please try again." }, { status: 500, headers: CORS_HEADERS });
  }
}
