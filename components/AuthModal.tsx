"use client";

import { useState } from "react";

export default function AuthModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: "login" | "signup";
  onModeChange: (m: "login" | "signup") => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload = mode === "signup" ? { name, email, password } : { email, password };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }
    // Reload so every part of the page (nav, gated pages) picks up the new session.
    window.location.reload();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,24,18,.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: 420, position: "relative", padding: 36 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 18, right: 18, background: "none", border: "none",
            fontSize: "1.3rem", cursor: "pointer", color: "var(--ink-soft)", lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => { onModeChange("login"); setError(null); }}
            className="pill"
            style={{
              flex: 1, textAlign: "center",
              background: mode === "login" ? "var(--ink)" : "transparent",
              color: mode === "login" ? "#fff" : "var(--ink-soft)",
              border: "1.5px solid var(--line)",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { onModeChange("signup"); setError(null); }}
            className="pill"
            style={{
              flex: 1, textAlign: "center",
              background: mode === "signup" ? "var(--ink)" : "transparent",
              color: mode === "signup" ? "#fff" : "var(--ink-soft)",
              border: "1.5px solid var(--line)",
            }}
          >
            Sign up
          </button>
        </div>

        <h2 className="font-display" style={{ fontSize: "1.4rem", marginBottom: 4 }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", marginBottom: 22 }}>
          {mode === "signup" ? "One account to save your consultations and plans." : "Log in to see your plans and consultations."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="modal-name">Full name</label>
              <input id="modal-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="modal-email">Email</label>
            <input id="modal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="modal-password">Password</label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
          </div>
          {error && <p style={{ fontSize: ".85rem", color: "var(--terracotta)", fontWeight: 500 }}>{error}</p>}
          <button type="submit" disabled={loading} className="pill pill-primary" style={{ textAlign: "center" }}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
