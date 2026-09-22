// WhatsApp notifications to customers — welcome, consultation confirmed,
// paid request confirmed, and (optionally) a free plan summary.
//
// SETUP REQUIRED before this does anything: this uses Meta's WhatsApp
// Business Cloud API format, which almost every provider (Meta directly,
// Interakt, AiSensy, Gupshup) speaks. You need:
//   1. A WhatsApp Business Platform account with a verified number
//   2. Message templates submitted and approved by Meta (you can't send
//      free-form text for these — only pre-approved templates)
//   3. Four environment variables in Vercel:
//        WHATSAPP_PHONE_NUMBER_ID   — from your WhatsApp Business account
//        WHATSAPP_ACCESS_TOKEN      — API access token
//        WHATSAPP_API_VERSION       — optional, defaults to v20.0
//        WHATSAPP_TEMPLATE_LANG     — optional, defaults to "en"
// Until WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are both set,
// every call below silently does nothing — safe to leave wired in before
// you've set any of this up.

interface WhatsAppTemplateMessage {
  to: string; // phone number in any common format — normalized below
  templateName: string;
  bodyParams?: string[]; // fills {{1}}, {{2}}... in the approved template body, in order
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`; // bare Indian mobile number, no country code
  return digits;
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppTemplate(msg: WhatsAppTemplateMessage): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return; // not configured yet — no-op, never throws

  const to = normalizePhone(msg.to);
  if (!to) return;

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  try {
    await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: msg.templateName,
          language: { code: languageCode },
          components: msg.bodyParams?.length
            ? [{ type: "body", parameters: msg.bodyParams.map((p) => ({ type: "text", text: p })) }]
            : undefined,
        },
      }),
    });
  } catch {
    // A WhatsApp failure should never break the request that triggered it
    // (signup, booking a consultation, etc.) — swallow and move on.
  }
}
