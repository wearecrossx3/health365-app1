import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getUserById, getUserByEmail } from "@/lib/kv";
import { sendResetLink, siteBase } from "@/lib/resetDelivery";

export const dynamic = "force-dynamic";

// POST { userId } or { email } → a one-time link the admin sends to the user.
// Built on the same domain the admin is using right now, so it always points at this live site.
export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "users");
  if (!session) return denied();
  const body = await req.json().catch(() => ({}));
  const user = body.userId
    ? await getUserById(String(body.userId))
    : body.email ? await getUserByEmail(String(body.email).trim()) : null;
  if (!user) return NextResponse.json({ error: "No Health365 account found with this email." }, { status: 404 });

  const r = await sendResetLink(user, siteBase(req), session.email || "admin");
  return NextResponse.json({ link: r.link, hours: r.hours, emailed: r.emailed, whatsapped: r.whatsapped, user: { id: user.id, name: user.name, email: user.email, phone: user.phone || "" } });
}
