"use client";
import { useState } from "react";

export default function PhoneCard({ initial }: { initial: string }) {
  const [saved, setSaved] = useState(initial);
  const [val, setVal] = useState(initial);
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/account/phone", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone: val }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(j.error || "Couldn't save. Please try again."); return; }
    setSaved(j.phone); setVal(j.phone); setEditing(false); setMsg("Saved ✓");
  }

  return (
    <div className="panel" style={{ marginBottom: 24, borderColor: saved ? undefined : "var(--teal)" }}>
      <h2 style={{ fontSize: "1.15rem", marginBottom: 6 }}>📱 Mobile number</h2>
      {!saved && <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 12 }}>Add your number so your dietitian can reach you about appointments and plans.</p>}
      {editing ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={val} onChange={(e) => setVal(e.target.value)}
            style={{ flex: "1 1 220px", padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--line)", fontSize: ".95rem" }} />
          <button className="pill pill-primary" style={{ padding: "10px 20px", fontSize: ".85rem" }} disabled={busy || !val.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
          {saved && <button className="pill pill-outline" style={{ padding: "10px 16px", fontSize: ".85rem" }} onClick={() => { setVal(saved); setEditing(false); setMsg(""); }}>Cancel</button>}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <b style={{ fontSize: "1rem" }}>+91 {saved}</b>
          <button className="pill pill-outline" style={{ padding: "7px 14px", fontSize: ".8rem" }} onClick={() => { setEditing(true); setMsg(""); }}>Change</button>
        </div>
      )}
      {msg && <p style={{ fontSize: ".82rem", marginTop: 8, color: msg.startsWith("Saved") ? "var(--teal-deep)" : "#C0392B" }}>{msg}</p>}
    </div>
  );
}
