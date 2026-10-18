"use client";

import { useEffect, useState } from "react";

// Self-serve password reset. When neither email nor WhatsApp sending is set up
// yet, it falls back to the Contact page (the team sends the link by hand).
export default function ForgotForm() {
  const [avail, setAvail] = useState<null | { available: boolean; email: boolean; whatsapp: boolean }>(null);
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("email");
    if (q) setId(q);
    fetch("/api/auth/forgot").then((r) => r.json()).then(setAvail).catch(() => setAvail({ available: false, email: false, whatsapp: false }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const v = id.trim();
    if (!v.includes("@") && v.replace(/\D/g, "").length < 10) return setErr("Enter the email or 10-digit mobile number on your account.");
    setBusy(true);
    const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.status === 503) { setAvail({ available: false, email: false, whatsapp: false }); return; }
    if (!r.ok) return setErr(d.error || "Something went wrong — please try again.");
    setSent(true);
  }

  const where = avail ? [avail.email && "email", avail.whatsapp && "WhatsApp"].filter(Boolean).join(" and ") : "email";

  if (avail && !avail.available) return (
    <div className="step-card" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Forgot your password?</h1>
      <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>Send us a quick message with your email or mobile number and we&apos;ll send you a reset link on WhatsApp, usually within a few hours.</p>
      <a href="/contact?topic=forgot" className="pill pill-primary" style={{ display: "inline-block", marginTop: 18 }}>Ask for a reset link</a>
    </div>
  );

  if (sent) return (
    <div className="step-card" style={{ textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px" }}>✓</div>
      <h1 style={{ fontSize: "1.4rem" }}>Check your {where}</h1>
      <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>If a Health365 account matches <b>{id.trim()}</b>, we&apos;ve sent a link to choose a new password. It works once and expires in 24 hours.</p>
      <p style={{ marginTop: 14, fontSize: ".88rem", color: "var(--ink-soft)" }}>Nothing after a few minutes? Check spam, or <a href="/contact?topic=forgot" style={{ fontWeight: 600 }}>contact us</a>.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="step-card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <span className="eyebrow">Health365 account</span>
        <h1 style={{ fontSize: "1.6rem" }}>Forgot your password?</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)" }}>Enter the email or mobile number on your account. We&apos;ll send you a link to choose a new password.</p>
      </div>
      <div className="field">
        <label htmlFor="fid">Email or mobile number</label>
        <input id="fid" value={id} onChange={(e) => setId(e.target.value)} autoComplete="email" placeholder="you@example.com or 98XXXXXXXX" required />
      </div>
      {err && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{err}</p>}
      <button type="submit" disabled={busy || !avail} className="pill pill-primary" style={{ textAlign: "center" }}>{busy ? "Sending…" : "Send reset link"}</button>
      <a href="/login" style={{ fontSize: ".9rem", textAlign: "center", color: "var(--ink-soft)" }}>Back to log in</a>
    </form>
  );
}
