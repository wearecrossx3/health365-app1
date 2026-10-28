// Minimal email sending via Resend's REST API (https://resend.com) —
// no npm package needed, just a fetch call. If RESEND_API_KEY isn't
// set, this quietly skips instead of breaking the flow it's called
// from (signup, booking, etc. should never fail because email isn't
// configured yet).

export async function sendEmail(args: { to: string | string[]; subject: string; html: string }): Promise<boolean> {
  return (await sendEmailResult(args)).ok;
}

// Same as sendEmail, but also says WHY an email didn't go (shown to the
// owner in Admin, so a missing key or an unverified domain is easy to spot).
export async function sendEmailResult({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Trim stray spaces / quotes / "KEY=" that sneak in when pasting into Vercel.
  const apiKey = (process.env.RESEND_API_KEY || "").trim().replace(/^RESEND_API_KEY\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    console.log(`[email skipped — no RESEND_API_KEY] ${subject} -> ${to}`);
    return { ok: false, error: "Email isn't set up yet: RESEND_API_KEY is missing in Vercel." };
  }
  if (!to || (Array.isArray(to) && to.length === 0)) return { ok: false, error: "No email address on this account." };
  const from = (process.env.RESEND_FROM_EMAIL || "").trim().replace(/^["']|["']$/g, "") || "Health365 <onboarding@resend.dev>";

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
      const t = await res.text();
      console.error("Email send failed:", t);
      let m = t;
      try { m = JSON.parse(t).message || t; } catch {}
      if (/api key is invalid/i.test(m)) {
        // Safe hint only: the first 3 characters and the length, never the key itself.
        m = `Resend says the API key is invalid. The key Vercel has starts with "${apiKey.slice(0, 3)}" and is ${apiKey.length} characters long. A Resend key starts with "re_" and is usually about 36 characters. Paste a fresh key into RESEND_API_KEY, then Redeploy.`;
      } else if (/verify a domain|testing emails|own email address/i.test(m)) {
        m = "Resend only sends to your own address until the thehealth365.in domain is verified in Resend (and RESEND_FROM_EMAIL uses it). " + m;
      }
      return { ok: false, error: String(m).slice(0, 300) };
    }
    return { ok: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { ok: false, error: "Couldn't reach the email service." };
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
