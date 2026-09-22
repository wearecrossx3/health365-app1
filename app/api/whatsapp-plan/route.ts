import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json({ error: "WhatsApp isn't set up yet — ask the site owner to add their WhatsApp Business credentials." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const { phone, name, planSummary } = body || {};
  if (!phone || !String(phone).trim()) {
    return NextResponse.json({ error: "Please share a phone number." }, { status: 400 });
  }

  await sendWhatsAppTemplate({
    to: String(phone),
    templateName: process.env.WHATSAPP_TEMPLATE_DIET_PLAN || "health365_diet_plan_ready",
    bodyParams: [name ? String(name) : "there", planSummary ? String(planSummary) : "your plan"],
  });

  return NextResponse.json({ ok: true });
}
