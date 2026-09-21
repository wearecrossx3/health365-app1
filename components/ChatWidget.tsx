"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show the customer-facing chat bubble inside the admin panel.
  if (pathname?.startsWith("/admin")) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await fetch("/api/chat", {
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
    setMessage("");
  }

  function closeAndReset() {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setError(null);
    }, 300);
  }

  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 90 }}>
      {open && (
        <div
          style={{
            position: "absolute", bottom: 66, left: 0, width: 300,
            background: "#fff", borderRadius: 18, border: "1px solid var(--line)",
            boxShadow: "0 24px 48px -16px rgba(0,0,0,.25)", padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".98rem" }}>Chat with us</p>
              <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 2 }}>We usually reply within a day.</p>
            </div>
            <button
              onClick={closeAndReset}
              aria-label="Close"
              style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "var(--ink-soft)", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "18px 0 6px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", margin: "0 auto 10px" }}>✓</div>
              <p style={{ fontSize: ".88rem", fontWeight: 600 }}>Message sent</p>
              <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4 }}>Thanks — we&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".85rem" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, so we can reply)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".85rem" }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="How can we help?"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".85rem", resize: "none" }}
              />
              {error && <p style={{ color: "var(--terracotta)", fontSize: ".78rem" }}>{error}</p>}
              <button type="submit" disabled={sending} className="pill pill-primary" style={{ textAlign: "center", padding: "10px 16px", fontSize: ".85rem" }}>
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: "var(--ink)", color: "#fff", fontSize: "1.3rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 24px -8px rgba(0,0,0,.35)", cursor: "pointer",
        }}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
