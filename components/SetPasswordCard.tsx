"use client";
import { useEffect, useState } from "react";

// "Set / change password" — mainly for people who joined with Google and
// need a password to log in to the Health365 apps.
export default function SetPasswordCard({ className, style, compact }: { className?: string; style?: React.CSSProperties; compact?: boolean }) {
  const [google, setGoogle] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/account/password", { cache: "no-store" }).then((r) => r.json()).then((j) => setGoogle(!!j.google)).catch(() => setGoogle(false)); }, []);
  if (google === null) return null;

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/account/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw, current: cur }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(j.error || "Couldn't save. Please try again."); return; }
    setMsg("Password saved ✓ — use your email and this password to log in to the app."); setOpen(false); setPw(""); setCur("");
  }
  const input: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 15, marginTop: 8, boxSizing: "border-box" };

  return (
    <div className={className} style={style}>
      <h3 style={{ margin: 0, fontSize: compact ? 16 : "1.15rem" }}>🔑 {google ? "Set a password for the app" : "Change password"}</h3>
      {google && <p style={{ margin: "6px 0 0", fontSize: 13.5, opacity: 0.75 }}>You joined with Google. Set a password once, then log in to the Health365 app with your email and this password.</p>}
      {!open ? (
        <button onClick={() => { setOpen(true); setMsg(""); }} style={{ marginTop: 10, padding: "9px 16px", borderRadius: 99, border: "1.5px solid #287379", background: "#fff", color: "#287379", fontWeight: 700, cursor: "pointer" }}>
          {google ? "Set password" : "Change password"}
        </button>
      ) : (
        <div>
          {!google && <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} style={input} autoComplete="current-password" />}
          <input type="password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} style={input} autoComplete="new-password" />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button disabled={busy || pw.length < 8} onClick={save} style={{ padding: "9px 18px", borderRadius: 99, border: "none", background: "#287379", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy || pw.length < 8 ? 0.6 : 1 }}>{busy ? "Saving…" : "Save"}</button>
            <button onClick={() => { setOpen(false); setMsg(""); }} style={{ padding: "9px 14px", borderRadius: 99, border: "1.5px solid #ccc", background: "#fff", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      {msg && <p style={{ margin: "8px 0 0", fontSize: 13, color: msg.includes("✓") ? "#1E6B4F" : "#C0392B" }}>{msg}</p>}
    </div>
  );
}
