"use client";

import { useState } from "react";
import type { NudgeSettings, Nudge } from "@/lib/nudges";
import { FUN_PACK } from "@/lib/nudgePack";

const AUD = [["all", "Everyone"], ["account", "Has account"], ["guest", "No account"], ["diabetes", "Diabetes"], ["pcos", "PCOS"], ["thyroid", "Thyroid"], ["cholesterol", "Cholesterol"], ["digestive", "Digestive"], ["weight", "Weight"]];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const box = { padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 10, fontSize: ".86rem", width: "100%" } as const;

export default function NudgesManager({ initial }: { initial: NudgeSettings }) {
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (p: Partial<NudgeSettings>) => { setS((x) => ({ ...x, ...p })); setSaved(false); };
  const setN = (i: number, p: Partial<Nudge>) => set({ nudges: s.nudges.map((n, k) => (k === i ? { ...n, ...p } : n)) });
  const packNew = (() => {
    const ids = new Set(s.nudges.map((x) => x.id));
    const titles = new Set(s.nudges.map((x) => x.title.trim().toLowerCase()));
    return FUN_PACK.filter((x) => !ids.has(x.id) && !titles.has(x.title.trim().toLowerCase()));
  })();

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/nudges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) { setS(d.settings); setSaved(true); }
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 36 }}>
      <div>
        <h2 style={{ fontSize: "1.15rem" }}>Random nudges</h2>
        <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", marginTop: 6 }}>
          Short, fun reminders (like food-delivery apps send) that pop up at random times inside the window below. The phone
          picks them from this list by itself, so they arrive even without internet. Needs app version 1.0.7 or newer.
        </p>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><input type="checkbox" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />Send random nudges</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <label style={{ fontSize: ".8rem", fontWeight: 700 }}>Per day
          <select style={box} value={s.perDay} onChange={(e) => set({ perDay: Number(e.target.value) })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <label style={{ fontSize: ".8rem", fontWeight: 700 }}>From
          <select style={box} value={s.fromHour} onChange={(e) => set({ fromHour: Number(e.target.value) })}>{Array.from({ length: 17 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
        </label>
        <label style={{ fontSize: ".8rem", fontWeight: 700 }}>Until
          <select style={box} value={s.toHour} onChange={(e) => set({ toHour: Number(e.target.value) })}>{Array.from({ length: 17 }, (_, i) => i + 7).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
        </label>
      </div>
      <div>
        <p style={{ fontSize: ".8rem", fontWeight: 700, marginBottom: 6 }}>No nudges on</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAYS.map((d, i) => {
            const on = s.quietDays.includes(i);
            return <button type="button" key={d} onClick={() => set({ quietDays: on ? s.quietDays.filter((x) => x !== i) : [...s.quietDays, i] })} style={{ padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${on ? "#E5394F" : "var(--line)"}`, background: on ? "#FDECEE" : "#fff", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}>{d}</button>;
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {s.nudges.map((n, i) => (
          <div key={n.id} className="adm-nudge" style={{ display: "grid", gridTemplateColumns: "24px 1fr 1.6fr 120px 24px", gap: 8, alignItems: "center", opacity: n.enabled ? 1 : 0.5 }}>
            <input type="checkbox" checked={n.enabled} onChange={(e) => setN(i, { enabled: e.target.checked })} />
            <input style={box} value={n.title} maxLength={60} onChange={(e) => setN(i, { title: e.target.value })} placeholder="Title" />
            <input style={box} value={n.body} maxLength={160} onChange={(e) => setN(i, { body: e.target.value })} placeholder="Message" />
            <select style={box} value={n.audience} onChange={(e) => setN(i, { audience: e.target.value })}>{AUD.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button type="button" onClick={() => set({ nudges: s.nudges.filter((_, k) => k !== i) })} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer" }}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="pill" onClick={() => set({ nudges: [...s.nudges, { id: Math.random().toString(36).slice(2, 9), title: "", body: "", audience: "all", enabled: true }] })}>+ Add nudge</button>
          {packNew.length > 0 && (
            <button type="button" className="pill pill-outline" onClick={() => set({ nudges: [...s.nudges, ...packNew] })}>🎉 Add Health365 fun pack (+{packNew.length})</button>
          )}
          <span style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{s.nudges.length} nudges · {s.nudges.filter((x) => x.enabled).length} on</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="pill pill-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save nudges"}</button>
        {saved && <span style={{ color: "#256B3C", fontWeight: 600, fontSize: ".88rem" }}>✓ Saved</span>}
      </div>
    </div>
  );
}
