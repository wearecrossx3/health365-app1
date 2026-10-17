import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getUserById, getUserByEmail } from "@/lib/kv";
import { createResetLink } from "@/lib/passwordReset";
import { sendEmail, emailWrapper } from "@/lib/email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// POST { userId } or { email } → a one-time link the admin sends to the user.
export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "users");
  if (!session) return denied();
  const body = await req.json().catch(() => ({}));
  const user = body.userId
    ? await getUserById(String(body.userId))
    : body.email ? await getUserByEmail(String(body.email).trim()) : null;
  if (!user) return NextResponse.json({ error: "No Health365 account found with this email." }, { status: 404 });

  const { token, hours } = await createResetLink(user.id, session.email || "admin");
  // Build the link on the same domain the admin is using right now, so it
  // always points at this live site (not an old/preview address).
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = (host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
  const link = `${base}/reset-password?t=${token}`;

  // Also email it when an email service is set up (RESEND_API_KEY).
  const emailOn = !!process.env.RESEND_API_KEY;
  if (emailOn) {
    await sendEmail({
      to: user.email,
      subject: "Reset your Health365 password",
      html: emailWrapper(
        "Reset your password",
        `<p>Hi ${user.name.split(" ")[0].replace(/</g, "&lt;")},</p><p>Tap the button below to choose a new password for your Health365 account. The link works once and expires in ${hours} hours.</p>
         <p><a href="${link}" style="display:inline-block;background:#20241F;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">Choose a new password</a></p>
         <p style="font-size:12px;color:#888;">If you didn't ask for this, you can ignore this email.</p>`
      ),
    }).catch(() => {});
  }

  const waOn = isWhatsAppConfigured() && !!user.phone;
  if (waOn) {
    await sendWhatsAppTemplate({
      to: user.phone!,
      templateName: process.env.WHATSAPP_TEMPLATE_PASSWORD_RESET || "health365_password_reset",
      bodyParams: [user.name.split(" ")[0], link],
    });
  }

  return NextResponse.json({ link, hours, emailed: emailOn, whatsapped: waOn, user: { id: user.id, name: user.name, email: user.email, phone: user.phone || "" } });
}
