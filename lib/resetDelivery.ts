import { createResetLink } from "@/lib/passwordReset";
import { sendEmail, emailWrapper } from "@/lib/email";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";
import type { User } from "@/lib/kv";

// One place that makes a one-time password-reset link and sends it by
// email (when RESEND_API_KEY is set) and WhatsApp (when the Meta keys are set).
// Used by the admin's "reset link" button and the self-serve Forgot password page.
export function canSendResetLinks() {
  return { email: !!process.env.RESEND_API_KEY, whatsapp: isWhatsAppConfigured() };
}

export async function sendResetLink(user: User, base: string, by: string) {
  const { token, hours } = await createResetLink(user.id, by);
  const link = `${base.replace(/\/$/, "")}/reset-password?t=${token}`;
  const first = user.name.split(" ")[0] || "there";
  const ch = canSendResetLinks();
  let emailed = false, whatsapped = false;
  if (ch.email) {
    emailed = await sendEmail({
      to: user.email,
      subject: "Reset your Health365 password",
      html: emailWrapper(
        "Reset your password",
        `<p>Hi ${first.replace(/</g, "&lt;")},</p><p>Tap the button below to choose a new password for your Health365 account. The link works once and expires in ${hours} hours.</p>
         <p><a href="${link}" style="display:inline-block;background:#20241F;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">Choose a new password</a></p>
         <p style="font-size:12px;color:#888;">If you didn't ask for this, you can ignore this email.</p>`
      ),
    }).then(() => true).catch(() => false);
  }
  if (ch.whatsapp && user.phone) {
    await sendWhatsAppTemplate({
      to: user.phone,
      templateName: process.env.WHATSAPP_TEMPLATE_PASSWORD_RESET || "health365_password_reset",
      bodyParams: [first, link],
    }).then(() => { whatsapped = true; }).catch(() => {});
  }
  return { link, hours, emailed, whatsapped };
}

export function siteBase(req: { headers: Headers; nextUrl: { origin: string } }) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return (host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
}
