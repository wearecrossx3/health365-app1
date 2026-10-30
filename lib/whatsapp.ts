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

import { redis } from "./kv";

// Last send result + daily counts, shown on the admin dashboard so setup
// problems (wrong token, template not approved…) are visible.
export interface WhatsAppHealth { configured: boolean; sentToday: number; failedToday: number; lastOk: { at: string; template: string } | null; lastError: { at: string; template: string; error: string } | null }
const day = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
async function recordWhatsApp(ok: boolean, template: string, error: string) {
  try {
    const r = redis(); const k = `wa_stats:${day()}`;
    await r.hincrby(k, ok ? "sent" : "failed", 1); await r.expire(k, 60 * 60 * 24 * 40);
    const at = new Date().toISOString();
    if (ok) await r.set("wa_last_ok", JSON.stringify({ at, template }));
    else await r.set("wa_last_error", JSON.stringify({ at, template, error }));
  } catch { /* stats must never break sending */ }
}
export async function getWhatsAppHealth(): Promise<WhatsAppHealth> {
  const r = redis();
  const [st, ok, er] = await Promise.all([r.hgetall(`wa_stats:${day()}`).catch(() => ({} as Record<string, string>)), r.get("wa_last_ok").catch(() => null), r.get("wa_last_error").catch(() => null)]);
  const parse = (v: string | null) => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
  return { configured: isWhatsAppConfigured(), sentToday: Number(st?.sent || 0), failedToday: Number(st?.failed || 0), lastOk: parse(ok), lastError: parse(er) };
}

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
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
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
    await import("./sentLog").then((x) => x.logSent(to, { via: "whatsapp", what: msg.templateName, ok: res.ok })).catch(() => {});
    if (res.ok) await recordWhatsApp(true, msg.templateName, "");
    else {
      const d = await res.json().catch(() => ({}));
      const e = (d && d.error) || {};
      await recordWhatsApp(false, msg.templateName, String(e.error_user_msg || e.message || `HTTP ${res.status}`).slice(0, 240));
    }
  } catch {
    await recordWhatsApp(false, msg.templateName, "Couldn't reach WhatsApp").catch(() => {});
    // A WhatsApp failure should never break the request that triggered it
    // (signup, booking a consultation, etc.) — swallow and move on.
  }
}
