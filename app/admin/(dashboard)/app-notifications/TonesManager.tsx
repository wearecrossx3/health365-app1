"use client";

import { useState } from "react";

type Opt = { key: string; label: string };

// Pick which sound each kind of app notification makes, for everyone.
export default function TonesManager({ types, tones, initial }: { types: Opt[]; tones: Opt[]; initial: Record<string, string> }) {
  const [sel, setSel] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const play = (t: string) => {
    if (t === "default") return;
    try { new Audio(`/tones/${t}.mp3`).play(); } catch { /* ignore */ }
  };
  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/notif-tones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tones: sel }) });
    setBusy(false);
    setMsg(r.ok ? "Saved ✓ — phones pick it up the next time the app opens or checks for news (about 30 min)." : "Couldn't save — try again.");
  }

  return (
    <div className="panel" style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
      <h2 style={{ fontSize: "1.05rem" }}>Notification tones 🔔</h2>
      <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 8 }}>
        Choose the sound for each kind of notification. Press ▶ to listen. Works on app version 2.0.4 and newer.
      </p>
      {types.map((ty) => (
        <div key={ty.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 180px", fontSize: ".9rem", fontWeight: 600 }}>{ty.label}</span>
          <select value={sel[ty.key]} onChange={(e) => { setSel({ ...sel, [ty.key]: e.target.value }); play(e.target.value); }} style={{ flex: "1 1 150px", padding: "8px 10px", borderRadius: 10, border: "1.5px solid var(--line)" }}>
            {tones.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <button type="button" onClick={() => play(sel[ty.key])} disabled={sel[ty.key] === "default"} className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".85rem" }} aria-label="Play">▶</button>
        </div>
      ))}
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={save} disabled={busy} className="pill pill-primary">{busy ? "Saving…" : "Save tones"}</button>
      </div>
      {msg && <p style={{ fontSize: ".85rem", color: msg.startsWith("Saved") ? "#2E7D4F" : "var(--terracotta)", fontWeight: 600, marginTop: 6 }}>{msg}</p>}
    </div>
  );
}
