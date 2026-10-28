"use client";
import { useState } from "react";

// Shows a user's mobile number with Call / WhatsApp, and lets the admin add or change it.
export default function AdminPhone({ userId, phone, phoneFrom, onSaved }: { userId: string; phone: string; phoneFrom?: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(phone || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fromOther = !!phone && !!phoneFrom && phoneFrom !== "account";

  async function save() {
    setBusy(true); setErr("");
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "setPhone", phone: val }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Couldn't save — try again."); return; }
    setEditing(false); onSaved();
  }

  if (editing) return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input type="tel" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} placeholder="10-digit mobile number"
        style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: ".9rem", width: 200 }} />
      <button className="pill pill-primary" style={{ padding: "6px 14px", fontSize: ".8rem" }} disabled={busy || !val.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      <button className="pill pill-outline" style={{ padding: "6px 12px", fontSize: ".8rem" }} onClick={() => { setEditing(false); setErr(""); setVal(phone || ""); }}>Cancel</button>
      {err && <span style={{ fontSize: ".8rem", color: "#C0392B", width: "100%" }}>{err}</span>}
    </div>
  );

  return phone ? (
    <p style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: ".95rem" }}>
      <b>📞 +91 {phone}</b>
      <a href={`tel:+91${phone}`} className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }}>Call</a>
      <a href={`https://wa.me/91${phone}`} target="_blank" rel="noreferrer" className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }}>WhatsApp</a>
      <button className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }} onClick={() => setEditing(true)}>✏️ {fromOther ? "Save to account" : "Change"}</button>
      {fromOther && <span style={{ fontSize: ".75rem", color: "var(--ink-soft)" }}>(from their {phoneFrom === "consultation" ? "consultation form" : "app profile"})</span>}
    </p>
  ) : (
    <p style={{ marginTop: 8, fontSize: ".85rem", color: "var(--ink-soft)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      📞 No mobile number yet.
      <button className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }} onClick={() => setEditing(true)}>+ Add number</button>
    </p>
  );
}
