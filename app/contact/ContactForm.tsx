"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="step-card" style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px" }}>✓</div>
        <h2 style={{ fontSize: "1.3rem" }}>Message sent</h2>
        <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>Thanks for reaching out — we&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="step-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="field">
        <label>Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required placeholder="How can we help?" />
      </div>
      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <button type="submit" disabled={sending} className="pill pill-primary" style={{ textAlign: "center" }}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
