"use client";

import { useEffect, useState } from "react";

type Topic = "forgot" | "other";

export default function ContactForm() {
  const [topic, setTopic] = useState<Topic>("other");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // /contact?topic=forgot opens straight on the password option
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("topic") === "forgot") setTopic("forgot");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const forgot = topic === "forgot";
    if (forgot && phone && phone.replace(/\D/g, "").length < 10) return setError("Please enter a 10-digit mobile number.");
    setSending(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        forgot
          ? { topic: "forgot", name: name || email.split("@")[0], email, phone, message: message || "I forgot my password — please send me a reset link." }
          : { name, email, message }
      ),
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
        <h2 style={{ fontSize: "1.3rem" }}>{topic === "forgot" ? "Request received" : "Message sent"}</h2>
        <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>
          {topic === "forgot"
            ? "We'll send you a link to choose a new password — on WhatsApp or email, usually within a few hours."
            : "Thanks for reaching out — we'll get back to you soon."}
        </p>
      </div>
    );
  }

  const chip = (t: Topic, label: string) => (
    <button
      type="button"
      onClick={() => { setTopic(t); setError(null); }}
      className={`pill ${topic === t ? "pill-primary" : "pill-outline"}`}
      style={{ padding: "8px 16px", fontSize: ".85rem" }}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="step-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="field">
        <label>What do you need help with?</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          {chip("forgot", "🔑 Forgot password")}
          {chip("other", "💬 Something else")}
        </div>
      </div>

      {topic === "forgot" ? (
        <>
          <p style={{ fontSize: ".9rem", color: "var(--ink-soft)", marginTop: -6 }}>
            Enter the email you use for Health365. We&apos;ll send you a link to choose a new password.
          </p>
          <div className="field">
            <label>Account email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label>Mobile number (WhatsApp)</label>
            <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, "").slice(0, 15))} placeholder="10-digit number" autoComplete="tel" />
          </div>
          <div className="field">
            <label>Your name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <button type="submit" disabled={sending} className="pill pill-primary" style={{ textAlign: "center" }}>
        {sending ? "Sending…" : topic === "forgot" ? "Send me a reset link" : "Send message"}
      </button>
    </form>
  );
}
