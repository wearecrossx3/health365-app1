import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { saveContactMessage, getSiteContent } from "@/lib/kv";
import { sendPushToAdmins } from "@/lib/push";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, phone, email, planSummary } = body || {};
  if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
    return NextResponse.json({ error: "Please share your name and phone number." }, { status: 400 });
  }

  const content = await getSiteContent();
  const message =
    `Wants a paid 1:1 dietitian consultation (₹${content.premiumDiscountedPrice}, paid via UPI) after generating a free plan.\n` +
    `Phone: ${phone}\n` +
    (planSummary ? `Plan: ${planSummary}\n` : "") +
    `They've confirmed payment on their end — please verify and follow up to schedule.`;

  await saveContactMessage({
    id: crypto.randomUUID(),
    name: String(name),
    email: email ? String(email) : "",
    message,
    source: "premium_consult",
    read: false,
    createdAt: new Date().toISOString(),
  }).catch(() => {});

  const admins = getAdminEmails();
  if (admins.length > 0) {
    await sendEmail({
      to: admins,
      subject: `Paid consultation request from ${name}`,
      html: emailWrapper(
        "New paid consultation request",
        `<p><b>${String(name)}</b> — ${phone}${email ? ` — ${email}` : ""}</p>
         <p>Requested a 1:1 dietitian consultation at ₹${content.premiumDiscountedPrice} (paid via UPI, unverified — please confirm before scheduling).</p>
         ${planSummary ? `<p style="color:#666;">Plan: ${String(planSummary).replace(/</g, "&lt;")}</p>` : ""}`
      ),
    }).catch(() => {});
  }

  sendPushToAdmins({
    title: `💰 Paid consultation request from ${name}`,
    body: `₹${content.premiumDiscountedPrice} — ${phone}`,
    url: "/admin/messages",
  }).catch(() => {});

  sendWhatsAppTemplate({
    to: String(phone),
    templateName: process.env.WHATSAPP_TEMPLATE_PREMIUM || "health365_consultation_confirmed",
    bodyParams: [String(name), content.premiumDiscountedPrice],
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
