"use client";

import { useState } from "react";

export default function DeleteAccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm) { setError("Please tick the box to confirm."); return; }
    setBusy(true);
    const res = await fetch("/api/app/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Something went wrong — please try again."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="step-card" style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px" }}>✓</div>
        <h2 style={{ fontSize: "1.3rem" }}>Your account has been deleted</h2>
        <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>All data linked to it was removed. We&apos;re sorry to see you go.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="step-card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="field">
        <label>Account email</label>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: ".9rem", cursor: "pointer" }}>
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2 }} />
        I understand this permanently deletes my account and data, and can&apos;t be undone.
      </label>
      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <button type="submit" disabled={busy} className="pill pill-primary" style={{ textAlign: "center", background: "var(--terracotta)", borderColor: "var(--terracotta)" }}>
        {busy ? "Deleting…" : "Delete my account permanently"}
      </button>
    </form>
  );
}
