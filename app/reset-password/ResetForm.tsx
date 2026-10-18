"use client";

import { useEffect, useState } from "react";
import PasswordInput from "@/components/PasswordInput";

type State = "checking" | "ready" | "bad" | "done";

export default function ResetForm() {
  const [state, setState] = useState<State>("checking");
  const [token, setToken] = useState("");
  const [who, setWho] = useState<{ name: string; email: string } | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    setToken(t);
    if (!t) { setState("bad"); return; }
    fetch(`/api/auth/reset-password?t=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setWho({ name: d.name, email: d.email }); setState("ready"); } else setState("bad"); })
      .catch(() => setState("bad"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords don't match.");
    setBusy(true);
    const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, password: pw }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Something went wrong — please try again."); if (r.status === 410) setState("bad"); return; }
    setState("done");
  }

  const card = { textAlign: "center" as const };
  const icon = (bg: string, ch: string) => (
    <div style={{ width: 56, height: 56, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px" }}>{ch}</div>
  );

  if (state === "checking") return <p style={{ color: "var(--ink-soft)", textAlign: "center" }}>Checking your link…</p>;

  if (state === "bad") return (
    <div className="step-card" style={card}>
      {icon("var(--terracotta)", "!")}
      <h1 style={{ fontSize: "1.4rem" }}>This link doesn&apos;t work any more</h1>
      <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>Reset links work once and expire after 24 hours. Get a new one in a few seconds.</p>
      <a href="/forgot-password" className="pill pill-primary" style={{ display: "inline-block", marginTop: 18 }}>Get a new link</a>
    </div>
  );

  if (state === "done") return (
    <div className="step-card" style={card}>
      {icon("var(--teal)", "✓")}
      <h1 style={{ fontSize: "1.4rem" }}>Password changed</h1>
      <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>Open the Health365 app (or the website) and log in with your email and the new password.</p>
      <a href="/login" className="pill pill-outline" style={{ display: "inline-block", marginTop: 18 }}>Log in on the website</a>
    </div>
  );

  return (
    <form onSubmit={submit} className="step-card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <span className="eyebrow">Health365 account</span>
        <h1 style={{ fontSize: "1.6rem" }}>Choose a new password</h1>
        {who && <p style={{ marginTop: 8, color: "var(--ink-soft)" }}>Hi {who.name} — this is for <b>{who.email}</b>.</p>}
      </div>
      <div className="field">
        <label>New password</label>
        <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" required />
      </div>
      <div className="field">
        <label>Type it again</label>
        <PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
      </div>
      {err && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{err}</p>}
      <button type="submit" disabled={busy} className="pill pill-primary" style={{ textAlign: "center" }}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
