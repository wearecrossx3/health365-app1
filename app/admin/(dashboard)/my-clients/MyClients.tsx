"use client";

import { useEffect, useState } from "react";
import ConsultChatPanel from "@/components/ConsultChatPanel";
import PlanBuilder from "../plan-generator/PlanBuilder";

type Row = { id: string; clientName: string; date: string; time: string; status: string; open: boolean; unread: number; lastText: string; lastAt: number; outcome: string };
type Detail = {
  thread: { id: string; client: string; date: string; time: string; status: string; open: boolean; note: string; outcome: string };
  profile: { goal: string; diet: string; conditions: string[]; allergens: string[]; answers: [string, string][]; at: string } | null;
  plans: { id: string; title: string; at: string; active: boolean }[];
};
const OUT: [string, string][] = [["", "Open"], ["done", "Done"], ["follow-up", "Follow-up due"], ["no-show", "No reply"]];
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function MyClients() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [earn, setEarn] = useState<{ fee: number; thisMonth: number; total: number } | null>(null);
  const [me, setMe] = useState("");
  const [sel, setSel] = useState("");
  const [det, setDet] = useState<Detail | null>(null);
  const [tab, setTab] = useState<"chat" | "info" | "plan">("chat");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");

  const loadList = async () => {
    const r = await fetch("/api/admin/my-clients", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setRows(d.threads); setEarn(d.earnings); setMe(d.me?.name || "");
  };
  const loadDet = async (id: string) => {
    const r = await fetch(`/api/admin/my-clients/${id}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setDet(d); setNote(d.thread.note || "");
  };
  useEffect(() => { loadList(); const t = setInterval(loadList, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { if (sel) { setDet(null); setTab("chat"); loadDet(sel); } }, [sel]);

  const post = (body: object) => fetch(`/api/admin/my-clients/${sel}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d })));

  if (!rows) return <p style={{ marginTop: 24 }}>Loading…</p>;

  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      {earn && (
        <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="panel" style={{ padding: 18 }}><div className="text-sm" style={{ color: "var(--ink-soft)" }}>Clients this month</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{earn.thisMonth}</div></div>
          <div className="panel" style={{ padding: 18 }}><div className="text-sm" style={{ color: "var(--ink-soft)" }}>All clients</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{earn.total}</div></div>
          <div className="panel" style={{ padding: 18 }}><div className="text-sm" style={{ color: "var(--ink-soft)" }}>Your fee</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{earn.fee ? `₹${earn.fee}` : "—"}</div></div>
        </div>
      )}

      {!sel && (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          {rows.length === 0 && <p style={{ padding: 20, color: "var(--ink-soft)" }}>No bookings yet. When a client books you, they appear here.</p>}
          {rows.map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)} style={{ display: "flex", width: "100%", textAlign: "left", gap: 12, alignItems: "center", padding: "14px 18px", background: "#fff", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
              <span style={{ width: 40, height: 40, borderRadius: 20, background: "#E3F0F0", color: "#1E5A5F", display: "grid", placeItems: "center", fontWeight: 700, flex: "none" }}>{r.clientName[0]}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: ".95rem" }}>{r.clientName}</b>
                <span style={{ display: "block", fontSize: ".8rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fmtDate(r.date)} · {r.time}{r.status !== "booked" ? " · cancelled" : !r.open ? " · closed" : ""}{r.lastText ? ` — ${r.lastText}` : ""}
                </span>
              </span>
              {r.outcome && <span style={{ fontSize: ".72rem", padding: "3px 9px", borderRadius: 99, background: "var(--paper)" }}>{OUT.find((o) => o[0] === r.outcome)?.[1]}</span>}
              {r.unread > 0 && <span style={{ width: 10, height: 10, borderRadius: 5, background: "#E5394F", flex: "none" }} aria-label="New message" />}
            </button>
          ))}
        </div>
      )}

      {sel && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button className="pill pill-outline" style={{ alignSelf: "flex-start", padding: "6px 14px" }} onClick={() => { setSel(""); loadList(); }}>← All clients</button>
          {!det ? <p>Loading…</p> : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: "1.3rem" }}>{det.thread.client}</h2>
                  <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Booked {fmtDate(det.thread.date)} · {det.thread.time}</p>
                </div>
                <select value={det.thread.outcome} onChange={async (e) => { const o = e.target.value; setDet({ ...det, thread: { ...det.thread, outcome: o } }); await post({ action: "outcome", outcome: o }); }} style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid var(--line)" }}>
                  {OUT.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["chat", "info", "plan"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={tab === t ? "pill pill-primary" : "pill pill-outline"} style={{ padding: "7px 16px", fontSize: ".85rem" }}>
                    {t === "chat" ? "💬 Chat" : t === "info" ? "📝 Details" : "📋 Plan"}
                  </button>
                ))}
              </div>

              {tab === "chat" && (
                <ConsultChatPanel threadId={det.thread.id} loadUrl={`/api/admin/my-clients/${det.thread.id}`} me="dietitian" canSend={det.thread.open}
                  closedText="This chat closed 30 days after the consultation. The client can book again to continue."
                  names={{ client: det.thread.client, dietitian: me || "You" }}
                  send={(b) => post({ action: "send", ...b })} />
              )}

              {tab === "info" && (
                <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!det.profile ? <p className="text-sm" style={{ color: "var(--ink-soft)" }}>This client hasn&apos;t filled the consultation form yet. You can ask your questions in the chat.</p> : (
                    <>
                      <p><b>Goal:</b> {det.profile.goal} · <b>Food:</b> {det.profile.diet}</p>
                      <p><b>Conditions:</b> {det.profile.conditions.join(", ") || "None"} · <b>Allergies:</b> {det.profile.allergens.join(", ") || "None"}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,40%) 1fr", gap: "6px 14px", fontSize: ".88rem" }}>
                        {det.profile.answers.map(([k, v]) => [<span key={k + "k"} style={{ color: "var(--ink-soft)" }}>{k}</span>, <span key={k + "v"} style={{ overflowWrap: "anywhere" }}>{v}</span>])}
                      </div>
                    </>
                  )}
                  <div className="field" style={{ marginBottom: 0, marginTop: 6 }}>
                    <label>Your private notes <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— only you and the Health365 team see these</span></label>
                    <textarea rows={4} maxLength={2000} value={note} onChange={(e) => { setNote(e.target.value); setSaved(""); }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button className="pill pill-primary" onClick={async () => { await post({ action: "note", note }); setSaved("Saved ✓"); }}>Save notes</button>
                    <span className="text-sm" style={{ color: "#2E7D4F" }}>{saved}</span>
                  </div>
                  {det.plans.length > 0 && <p className="text-sm">Plans you sent: {det.plans.map((p) => `${p.title}${p.active ? " (current)" : ""}`).join(", ")}</p>}
                </div>
              )}

              {tab === "plan" && (
                <PlanBuilder fixedUser={{ id: det.thread.id, name: det.thread.client, email: "", phone: "" }}
                  portal={{ generateUrl: "/api/admin/my-clients/generate", assignUrl: `/api/admin/my-clients/${det.thread.id}` }}
                  onAssigned={() => loadDet(det.thread.id)} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
