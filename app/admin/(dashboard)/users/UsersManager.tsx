"use client";

import { useEffect, useMemo, useState } from "react";
import PlanBuilder from "../plan-generator/PlanBuilder";
import ResetLinkBox from "../ResetLinkBox";

interface Row { id: string; name: string; email: string; phone: string; createdAt: string; freeUsed: boolean; grants: number; plans: number; access: string }
interface PlanSummary { id: string; title: string; assignedAt: string; assignedBy: string; active: boolean; targetKcal: number; days: { kcal: number }[]; note: string }
interface Detail {
  user: { id: string; name: string; email: string; phone: string; phoneFrom?: string; createdAt: string };
  ent: { freeUsed: boolean; freeUsedAt: string; grants: number; grantLog: { at: string; by: string; note: string; kind: string }[] };
  access: { allowed: boolean; reason: string };
  plans: PlanSummary[];
  consultations: { id: string; goal: string; conditions: string[]; createdAt: string; status: string }[];
  appointments: { id: string; date: string; time: string; dietitianName: string; status: string }[];
}

const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const ACCESS: Record<string, [string, string]> = {
  first_free: ["Free 7-day plan available", "#2E7D4F"],
  granted: ["Has a granted plan", "#287379"],
  locked: ["7-day plans locked", "#A51F31"],
};

export default function UsersManager() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [grantNote, setGrantNote] = useState("");

  const load = () => fetch("/api/admin/users").then((r) => r.json()).then((d) => setRows(d.users || [])).catch(() => setRows([]));
  const loadDetail = (id: string) => fetch(`/api/admin/users?id=${encodeURIComponent(id)}`).then((r) => r.json()).then((d) => setDetail(d.user ? d : null));
  useEffect(() => { load(); }, []);
  useEffect(() => { setDetail(null); if (sel) loadDetail(sel); }, [sel]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((u) => !s || [u.name, u.email, u.phone].some((x) => (x || "").toLowerCase().includes(s)));
  }, [rows, q]);

  async function act(body: Record<string, unknown>) {
    if (!sel) return;
    setBusy(true);
    await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: sel, ...body }) });
    setBusy(false);
    await loadDetail(sel);
    load();
  }

  if (sel && detail) {
    const [label, col] = ACCESS[detail.access.reason] || ["", "#555"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button onClick={() => setSel(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#287379", fontWeight: 700, cursor: "pointer", padding: 0 }}>← All users</button>
        <div className="panel">
          <h2 style={{ fontSize: "1.3rem" }}>{detail.user.name}</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", marginTop: 4 }}>{detail.user.email} · joined {fmt(detail.user.createdAt)}</p>
          {detail.user.phone ? (
            <p style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: ".95rem" }}>
              <b>📞 +91 {detail.user.phone}</b>
              <a href={`tel:+91${detail.user.phone}`} className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }}>Call</a>
              <a href={`https://wa.me/91${detail.user.phone}`} target="_blank" rel="noreferrer" className="pill pill-outline" style={{ padding: "4px 12px", fontSize: ".78rem" }}>WhatsApp</a>
              {detail.user.phoneFrom && detail.user.phoneFrom !== "account" && <span style={{ fontSize: ".75rem", color: "var(--ink-soft)" }}>(from their {detail.user.phoneFrom === "consultation" ? "consultation form" : "app profile"})</span>}
            </p>
          ) : (
            <p style={{ marginTop: 8, fontSize: ".85rem", color: "var(--ink-soft)" }}>📞 No mobile number — this account was made before the number was required.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <ResetLinkBox key={detail.user.id} userId={detail.user.id} phone={detail.user.phone} name={detail.user.name} />
          </div>
          <p style={{ marginTop: 12, fontWeight: 700, color: col }}>● {label}</p>
          <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginTop: 4 }}>
            First free 7-day plan: {detail.ent.freeUsed ? `used on ${fmt(detail.ent.freeUsedAt)}` : "not used yet"} · Unused grants: {detail.ent.grants}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
            <input value={grantNote} onChange={(e) => setGrantNote(e.target.value)} placeholder="Reason (optional) e.g. Paid consultation 12 Oct" style={{ flex: "1 1 240px", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 999, fontSize: ".86rem" }} />
            <button className="pill pill-primary" disabled={busy} onClick={() => { act({ action: "grant", count: 1, note: grantNote }); setGrantNote(""); }}>🎁 Give a free 7-day plan</button>
            {detail.ent.grants > 0 && <button className="pill" disabled={busy} onClick={() => act({ action: "revoke" })}>Remove unused grants</button>}
            {detail.ent.freeUsed && <button className="pill" disabled={busy} onClick={() => act({ action: "resetFree" })}>Reset first free plan</button>}
          </div>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>Plans from the dietitian</h2>
          {detail.plans.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No plan assigned yet. Make one below.</p>}
          {detail.plans.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <div>
                <p style={{ fontWeight: 700 }}>{p.title} {p.active && <span style={{ fontSize: ".72rem", color: "#2E7D4F", marginLeft: 6 }}>● Showing in app</span>}</p>
                <p style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{p.days.length} day{p.days.length > 1 ? "s" : ""} · ~{p.targetKcal} kcal/day · by {p.assignedBy} · {fmt(p.assignedAt)}</p>
                {p.note && <p style={{ fontSize: ".82rem", marginTop: 4 }}>“{p.note}”</p>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flex: "none" }}>
                {!p.active && <button onClick={() => act({ action: "activatePlan", planId: p.id })} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>Show this one</button>}
                <button onClick={() => confirm("Delete this plan?") && act({ action: "deletePlan", planId: p.id })} style={{ background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, fontSize: ".8rem", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {(detail.consultations.length > 0 || detail.appointments.length > 0) && (
          <div className="panel" style={{ fontSize: ".88rem" }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>Consultations &amp; bookings</h2>
            {detail.appointments.map((a) => <p key={a.id}>📅 {a.date} {a.time} with {a.dietitianName} — {a.status}</p>)}
            {detail.consultations.slice(0, 5).map((c) => <p key={c.id}>📝 {fmt(c.createdAt)} · {c.goal}{c.conditions?.length ? ` · ${c.conditions.join(", ")}` : ""} — {c.status}</p>)}
          </div>
        )}

        <h2 style={{ fontSize: "1.1rem" }}>Make a plan for {detail.user.name.split(" ")[0]}</h2>
        <PlanBuilder fixedUser={detail.user} onAssigned={() => loadDetail(detail.user.id)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 999, fontSize: ".92rem", background: "#fff" }} />
      {rows === null && <p style={{ color: "var(--ink-soft)" }}>Loading…</p>}
      {rows && <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>{list.length} of {rows.length} users</p>}
      {sel && !detail && <p style={{ color: "var(--ink-soft)" }}>Opening…</p>}
      {list.map((u) => {
        const [label, col] = ACCESS[u.access] || ["", "#555"];
        return (
          <button key={u.id} onClick={() => setSel(u.id)} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 16, textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700 }}>{u.name}</p>
              <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>{u.phone ? `📞 ${u.phone} · ` : "📞 no number · "}{u.email} · {fmt(u.createdAt)}</p>
            </div>
            <div style={{ textAlign: "right", flex: "none", fontSize: ".75rem" }}>
              <p style={{ color: col, fontWeight: 700 }}>● {label}</p>
              <p style={{ color: "var(--ink-soft)", marginTop: 2 }}>{u.plans} plan{u.plans === 1 ? "" : "s"}{u.grants ? ` · ${u.grants} grant` : ""}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
