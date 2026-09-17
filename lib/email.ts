// Minimal email sending via Resend's REST API (https://resend.com) —
// no npm package needed, just a fetch call. If RESEND_API_KEY isn't
// set, this quietly skips instead of breaking the flow it's called
// from (signup, booking, etc. should never fail because email isn't
// configured yet).

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email skipped — no RESEND_API_KEY] ${subject} -> ${to}`);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "Health365 <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Email send failed:", await res.text());
    }
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export function adminLink(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

// Shared, simple email wrapper so every notification looks consistent.
export function emailWrapper(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif; max-width:480px; margin:0 auto; padding:24px;">
      <h2 style="color:#20241F; margin-bottom:16px;">${title}</h2>
      <div style="color:#444; font-size:14px; line-height:1.6;">${bodyHtml}</div>
      <p style="margin-top:28px; font-size:12px; color:#999;">Health365 — general nutrition guidance, not a medical diagnosis.</p>
    </div>
  `;
}
