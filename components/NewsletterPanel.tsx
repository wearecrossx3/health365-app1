"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewsletterPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setError(data.error || "Something went wrong.");
      return;
    }
    setStatus("done");
  }

  return (
    <div
      style={{
        background: "var(--dark)", borderRadius: 28, padding: "48px", display: "flex",
        justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap",
      }}
    >
      <div style={{ maxWidth: 340 }}>
        <h2 style={{ color: "#fff", fontSize: "1.7rem" }}>Subscribe our newsletter</h2>
        <p style={{ color: "rgba(255,255,255,.65)", marginTop: 12, fontSize: ".9rem" }}>
          Subscribe to our newsletter and be the first to receive nutrition tips, new conditions guides, and updates from Health365.
        </p>
      </div>
      <div style={{ minWidth: 300 }}>
        <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
          Stay up to date
        </p>
        {status === "done" ? (
          <p style={{ color: "var(--mint)", fontSize: ".9rem", fontWeight: 600 }}>✓ You&apos;re subscribed — thank you!</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,.2)",
                background: "rgba(255,255,255,.06)", color: "#fff", fontSize: ".88rem",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                background: "var(--mint)", color: "var(--dark)", border: "none", borderRadius: 100,
                padding: "12px 22px", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", flex: "none",
              }}
            >
              {status === "loading" ? "…" : "Subscribe"}
            </button>
          </form>
        )}
        {error && <p style={{ color: "#FF8A70", fontSize: ".78rem", marginTop: 8 }}>{error}</p>}
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".74rem", marginTop: 10 }}>
          By subscribing you agree to our <Link href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
