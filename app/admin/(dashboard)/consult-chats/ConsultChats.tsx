"use client";

import { useEffect, useState } from "react";
import ConsultChatPanel from "@/components/ConsultChatPanel";

type Row = { id: string; clientName: string; dietitianName: string; dietitianId: string; date: string; time: string; status: string; lastText: string; lastAt: number; flags: number; outcome: string };
type Dt = { id: string; name: string; email: string; portal: boolean; activity: { at: number; what: string }[] };
const when = (t: number) => new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ConsultChats() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [dts, setDts] = useState<Dt[]>([]);
  const [sel, setSel] = useState<Row | null>(null);
  const [showLog, setShowLog] = useState("");
  const [filter, setFilter] = useState("");
  const [astha, setAstha] = useState<{ email: string; activity: { at: number; what: string }[] } | null>(null);
  const [aEmail, setAEmail] = useState("");
  const [aMsg, setAMsg] = useState("");

  const load = async () => {
    const r = await fetch("/api/admin/consult-chats", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setRows(d.threads); setDts(d.dietitians); setAstha(d.astha); setAEmail(d.astha?.email || "");
  };
  useEffect(() => { load(); }, []);

  async function togglePortal(d: Dt) {
    if (!confirm(d.portal ? `Turn off ${d.name}'s portal? They won't be able to log in or see their clients until you turn it back on.` : `Turn on ${d.name}'s portal?`)) return;
    await fetch("/api/admin/consult-chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "portal", dietitianId: d.id, portal: !d.portal }) });
    load();
  }

  if (!rows) return <p style={{ marginTop: 24 }}>Loading…</p>;
  const shown = rows.filter((r) => !filter || r.dietitianId === filter);

  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: 6 }}>Dietitian portal access</h2>
        {astha && (
          <div style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 160 }}><b>Dt. Astha Jadeja</b> <span className="text-sm" style={{ color: "var(--ink-soft)" }}>· Dietitian app login</span></span>
              <input value={aEmail} onChange={(e) => { setAEmail(e.target.value); setAMsg(""); }} type="email" style={{ padding: "7px 10px", borderRadius: 10, border: "1.5px solid var(--line)", minWidth: 220 }} />
              <button className="pill pill-outline" style={{ padding: "5px 12px", fontSize: ".78rem" }} onClick={async () => {
                const r = await fetch("/api/admin/consult-chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "asthaEmail", email: aEmail }) });
                const j = await r.json().catch(() => ({})); setAMsg(r.ok ? "Saved ✓" : j.error || "Couldn't save");
              }}>Save</button>
              <button className="pill pill-outline" style={{ padding: "5px 12px", fontSize: ".78rem" }} onClick={() => setShowLog(showLog === "dr-astha" ? "" : "dr-astha")}>Activity</button>
            </div>
            <p className="text-sm" style={{ color: aMsg.startsWith("Saved") ? "#2E7D4F" : "var(--ink-soft)", marginTop: 4 }}>{aMsg || "Whoever logs in to the Dietitian app with this email sees Dt. Astha's clients and chats. In the Admin app the same login still opens the full admin."}</p>
            {showLog === "dr-astha" && (
              <ul style={{ margin: "8px 0 0 18px", fontSize: ".8rem", color: "var(--ink-soft)" }}>
                {astha.activity.length === 0 ? <li>No activity yet.</li> : astha.activity.map((a, i) => <li key={i}>{when(a.at)} — {a.what}</li>)}
              </ul>
            )}
          </div>
        )}
        {dts.length === 0 && <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No joined dietitians yet.</p>}
        {dts.map((d) => (
          <div key={d.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 160 }}><b>{d.name}</b> <span className="text-sm" style={{ color: "var(--ink-soft)" }}>· logs in with {d.email}</span></span>
              <button className="pill pill-outline" style={{ padding: "5px 12px", fontSize: ".78rem" }} onClick={() => setShowLog(showLog === d.id ? "" : d.id)}>Activity</button>
              <button className="pill" onClick={() => togglePortal(d)} style={{ padding: "5px 12px", fontSize: ".78rem", background: d.portal ? "#2E7D4F" : "var(--terracotta)", color: "#fff", border: "none" }}>{d.portal ? "Portal ON" : "Portal OFF"}</button>
            </div>
            {showLog === d.id && (
              <ul style={{ margin: "8px 0 0 18px", fontSize: ".8rem", color: "var(--ink-soft)" }}>
                {d.activity.length === 0 ? <li>No activity yet.</li> : d.activity.map((a, i) => <li key={i}>{when(a.at)} — {a.what}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {!sel ? (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", gap: 10, alignItems: "center" }}>
            <b style={{ flex: 1 }}>Chats</b>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 10, border: "1.5px solid var(--line)" }}>
              <option value="">All dietitians</option>
              {dts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {shown.length === 0 && <p style={{ padding: 18, color: "var(--ink-soft)" }}>No chats yet.</p>}
          {shown.map((r) => (
            <button key={r.id} onClick={() => setSel(r)} style={{ display: "flex", width: "100%", textAlign: "left", gap: 10, padding: "12px 16px", background: "#fff", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", alignItems: "center" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{r.clientName}</b> ↔ {r.dietitianName}
                <span style={{ display: "block", fontSize: ".8rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.date} · {r.time}{r.lastText ? ` — ${r.lastText}` : " — no messages yet"}</span>
              </span>
              {r.flags > 0 && <span title="Tried to share contact details" style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--terracotta)" }}>⚠️ {r.flags}</span>}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="pill pill-outline" style={{ alignSelf: "flex-start", padding: "6px 14px" }} onClick={() => { setSel(null); load(); }}>← All chats</button>
          <h2 style={{ fontSize: "1.2rem" }}>{sel.clientName} ↔ {sel.dietitianName}</h2>
          <ConsultChatPanel threadId={sel.id} loadUrl={`/api/admin/consult-chats/${sel.id}`} me="team" canSend showOriginals
            names={{ client: sel.clientName, dietitian: sel.dietitianName }}
            send={(b) => fetch(`/api/admin/consult-chats/${sel.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d })))} />
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Messages you send here show as “Health365 team” to both of them.</p>
        </div>
      )}
    </div>
  );
}
