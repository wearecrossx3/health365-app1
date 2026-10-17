"use client";

import { useState } from "react";

// "🔑 Password reset link" for a user who forgot their password.
// Makes a one-time link (24 h) and gives quick ways to send it.
export default function ResetLinkBox({ userId, email, phone, name }: { userId?: string; email?: string; phone?: string; name?: string }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ link: string; hours: number; emailed: boolean; whatsapped?: boolean; user: { name: string; email: string; phone: string } } | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function make() {
    setBusy(true); setErr(""); setCopied(false);
    const r = await fetch("/api/admin/users/reset-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userId ? { userId } : { email }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Couldn't make a link — try again."); return; }
    setRes(d);
  }

  if (!res) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
        <button type="button" className="pill pill-outline" disabled={busy} onClick={make} style={{ padding: "8px 16px", fontSize: ".82rem" }}>
          {busy ? "Making link…" : "🔑 Password reset link"}
        </button>
        {err && <p style={{ color: "var(--terracotta)", fontSize: ".8rem" }}>{err}</p>}
      </div>
    );
  }

  const first = (res.user.name || name || "").split(" ")[0];
  const ph = String(res.user.phone || phone || "").replace(/\D/g, "").slice(-10);
  const msg = `Hi ${first}, here is your Health365 password reset link: ${res.link}\nOpen it, choose a new password, then log in to the app with your email ${res.user.email}. The link works once and expires in ${res.hours} hours.`;
  const wa = ph.length === 10 ? `https://wa.me/91${ph}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const mail = `mailto:${res.user.email}?subject=${encodeURIComponent("Reset your Health365 password")}&body=${encodeURIComponent(msg)}`;

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, background: "var(--paper)", display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <p style={{ fontWeight: 700, fontSize: ".9rem" }}>🔑 Reset link ready for {res.user.email}</p>
      <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", wordBreak: "break-all" }}>{res.link}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={wa} target="_blank" rel="noreferrer" className="pill pill-primary" style={{ padding: "8px 16px", fontSize: ".82rem" }}>
          Send on WhatsApp{ph.length === 10 ? ` (+91 ${ph})` : ""}
        </a>
        <a href={mail} className="pill pill-outline" style={{ padding: "8px 16px", fontSize: ".82rem" }}>Send by email</a>
        <button type="button" className="pill pill-outline" style={{ padding: "8px 16px", fontSize: ".82rem" }}
          onClick={() => { navigator.clipboard?.writeText(msg).then(() => setCopied(true)).catch(() => {}); }}>
          {copied ? "Copied ✓" : "Copy message"}
        </button>
      </div>
      <p style={{ fontSize: ".75rem", color: "var(--ink-soft)" }}>
        Works once · expires in {res.hours} hours · the user picks their own new password.
        {res.whatsapped ? " Also sent to their WhatsApp automatically." : ""}{res.emailed ? " We also emailed this link to them automatically." : ""}
      </p>
    </div>
  );
}
