"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPhone from "./AdminPhone";
import JourneyCard, { Journey } from "./JourneyCard";
import PlanBuilder, { Plan, ClientInfo } from "../plan-generator/PlanBuilder";
import ResetLinkBox from "../ResetLinkBox";
import UserEmailBox from "./UserEmailBox";
import WeightChart, { WeightPoint } from "@/components/WeightChart";

interface Row { id: string; name: string; email: string; phone: string; createdAt: string; freeUsed: boolean; grants: number; plans: number; access: string }
interface PlanSummary { id: string; title: string; assignedAt: string; assignedBy: string; active: boolean; targetKcal: number; days: { kcal: number }[]; note: string; updatedAt?: string; editedBy?: string }
interface Detail {
  user: { id: string; name: string; email: string; phone: string; phoneFrom?: string; createdAt: string };
  ent: { freeUsed: boolean; freeUsedAt: string; grants: number; grantLog: { at: string; by: string; note: string; kind: string }[] };
  access: { allowed: boolean; reason: string };
  plans: PlanSummary[];
  consultations: { id: string; goal: string; conditions: string[]; createdAt: string; status: string }[];
  appointments: { id: string; date: string; time: string; dietitianName: string; status: string }[];
  backup?: { current: Backup | null; older: (Backup & { index: number })[] };
  client?: ClientInfo | null;
  weights?: WeightPoint[];
  suggest?: { goal: string; diet: string; conditions: string[]; kcal: number; basis: string } | null;
  journey?: Journey | null;
}
interface Backup { updatedAt: number; name: string; onboarded: boolean; hasPlan: boolean; planTitle: string; weights: number; foodDays: number; trackDays: number; lastActive: string; size: number }
const when = (ms: number) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const bsum = (b: Backup) => [b.hasPlan ? `Plan: ${b.planTitle}` : "No plan", `${b.weights} weight entr${b.weights === 1 ? "y" : "ies"}`, `${b.foodDays} day${b.foodDays === 1 ? "" : "s"} of food log`, `${b.trackDays} day${b.trackDays === 1 ? "" : "s"} tracked`, b.lastActive ? `last activity ${b.lastActive}` : ""].filter(Boolean).join(" · ");

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
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");
  const [delErr, setDelErr] = useState("");
  const [notice, setNotice] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const [editing, setEditing] = useState<PlanSummary | null>(null);
  const [planSaved, setPlanSaved] = useState("");

  const load = () => fetch("/api/admin/users").then((r) => r.json()).then((d) => setRows(d.users || [])).catch(() => setRows([]));
  const loadDetail = (id: string) => fetch(`/api/admin/users?id=${encodeURIComponent(id)}`).then((r) => r.json()).then((d) => setDetail(d.user ? d : null));
  useEffect(() => { load(); }, []);
  useEffect(() => { setDetail(null); setEditing(null); setDelOpen(false); setDelText(""); setDelErr(""); if (sel) loadDetail(sel); }, [sel]);

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

  async function deleteUser() {
    if (!sel || !detail) return;
    setBusy(true); setDelErr("");
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: sel, action: "deleteUser", confirm: delText.trim() }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setDelErr(d.error || "Couldn't delete — try again."); return; }
    setNotice(`${detail.user.name} (${detail.user.email}) was deleted.`);
    setSel(null);
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
          <AdminPhone key={detail.user.id} userId={detail.user.id} phone={detail.user.phone} phoneFrom={detail.user.phoneFrom} onSaved={() => { loadDetail(detail.user.id); load(); }} />
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

        {detail.journey && <JourneyCard j={detail.journey} userId={detail.user.id} onChanged={() => { loadDetail(detail.user.id); load(); }} createdAt={detail.user.createdAt} consultations={detail.consultations} plans={detail.plans} />}

        <div className="panel">
          <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>Weight progress</h2>
          <WeightChart points={detail.weights || []} />
        </div>

        <div className="panel">
          <UserEmailBox key={detail.user.id} ids={[detail.user.id]} name={detail.user.name} />
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>Plans from the dietitian</h2>
          {detail.plans.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No plan assigned yet. Make one below.</p>}
          {detail.plans.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <div>
                <p style={{ fontWeight: 700 }}>{p.title} {p.active && <span style={{ fontSize: ".72rem", color: "#2E7D4F", marginLeft: 6 }}>● Showing in app</span>}</p>
                <p style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{p.days.length} day{p.days.length > 1 ? "s" : ""} · ~{p.targetKcal} kcal/day · by {p.assignedBy} · {fmt(p.assignedAt)}{p.updatedAt ? ` · edited ${fmt(p.updatedAt)}${p.editedBy ? ` by ${p.editedBy}` : ""}` : ""}</p>
                {p.note && <p style={{ fontSize: ".82rem", marginTop: 4 }}>“{p.note}”</p>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flex: "none" }}>
                <button onClick={() => { setPlanSaved(""); setEditing(p); setTimeout(() => document.getElementById("plan-maker")?.scrollIntoView({ behavior: "smooth" }), 50); }} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>✏️ Edit</button>
                {!p.active && <button onClick={() => act({ action: "activatePlan", planId: p.id })} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>Show this one</button>}
                <button onClick={() => confirm("Delete this plan?") && act({ action: "deletePlan", planId: p.id })} style={{ background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, fontSize: ".8rem", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>


        <div className="panel" style={{ fontSize: ".88rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: 6 }}>App progress backup</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: ".82rem", marginBottom: 10 }}>
            What the app saved for this account (plan, ticks, food log, water, weight). If their progress went missing, restore an older copy — then ask them to close and reopen the app.
          </p>
          {!detail.backup?.current ? (
            <p style={{ color: "var(--ink-soft)" }}>Nothing saved from the app yet.</p>
          ) : (
            <p><b>Current — saved {when(detail.backup.current.updatedAt)}</b><br /><span style={{ color: "var(--ink-soft)" }}>{bsum(detail.backup.current)}</span></p>
          )}
          {(detail.backup?.older || []).map((b) => (
            <div key={b.index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ flex: "1 1 260px" }}>Older copy — {when(b.updatedAt)}<br /><span style={{ color: "var(--ink-soft)" }}>{bsum(b)}</span></p>
              <button className="pill pill-outline" disabled={busy} style={{ padding: "6px 14px", fontSize: ".8rem" }}
                onClick={() => confirm(`Restore the copy from ${when(b.updatedAt)}? The current one is kept in this list too.`) && act({ action: "restoreBackup", index: b.index }).then(() => alert("Restored. Ask them to close and reopen the app."))}>
                Restore this
              </button>
            </div>
          ))}
        </div>

        <div id="plan-maker" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.1rem" }}>{editing ? `Edit “${editing.title}”` : `Make a plan for ${detail.user.name.split(" ")[0]}`}</h2>
          {editing && <button className="pill" onClick={() => setEditing(null)}>Cancel editing</button>}
        </div>
        {planSaved && !editing && <p style={{ background: "#E7F0DC", color: "#2E7D4F", borderRadius: 12, padding: "10px 14px", fontSize: ".88rem", fontWeight: 600 }}>{planSaved}</p>}
        <PlanBuilder key={editing?.id || "new"} fixedUser={detail.user} client={detail.client} initialInput={detail.suggest || null}
          initialPlan={editing ? (editing as unknown as Plan) : null} editId={editing?.id}
          onAssigned={() => { if (editing) { setPlanSaved(`✓ Changes to “${editing.title}” saved. ${detail.user.name.split(" ")[0]} sees them the next time the app opens.`); setEditing(null); } loadDetail(detail.user.id); }} />

        <div className="panel" style={{ borderColor: "#F2C4C9" }}>
          <h2 style={{ fontSize: "1.05rem", color: "#A51F31" }}>Delete this user</h2>
          <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginTop: 6 }}>
            Permanently removes the account and everything linked to it — plans, app progress backup, consultations, bookings and messages. This can&apos;t be undone.
          </p>
          {!delOpen ? (
            <button className="pill" onClick={() => setDelOpen(true)} style={{ marginTop: 14, background: "#FBE3E3", color: "#A51F31", padding: "8px 18px", fontSize: ".85rem" }}>🗑️ Delete user</button>
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: ".85rem", fontWeight: 600 }}>Type <b>{detail.user.email}</b> to confirm</label>
              <input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder={detail.user.email} autoCapitalize="none" autoCorrect="off" style={{ padding: "10px 14px", border: "1px solid #F2C4C9", borderRadius: 12, fontSize: "16px" }} />
              {delErr && <p style={{ color: "#A51F31", fontSize: ".82rem" }}>{delErr}</p>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="pill" disabled={busy || delText.trim().toLowerCase() !== detail.user.email.toLowerCase()} onClick={deleteUser}
                  style={{ background: "#A51F31", color: "#fff", padding: "8px 18px", fontSize: ".85rem", opacity: delText.trim().toLowerCase() === detail.user.email.toLowerCase() ? 1 : 0.45 }}>
                  {busy ? "Deleting…" : "Delete permanently"}
                </button>
                <button className="pill pill-outline" onClick={() => { setDelOpen(false); setDelText(""); setDelErr(""); }} style={{ padding: "8px 18px", fontSize: ".85rem" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 999, fontSize: ".92rem", background: "#fff" }} />
      {notice && <p style={{ background: "#E7F0DC", color: "#2E7D4F", borderRadius: 12, padding: "10px 14px", fontSize: ".88rem", fontWeight: 600 }}>✓ {notice}</p>}
      {rows === null && <p style={{ color: "var(--ink-soft)" }}>Loading…</p>}
      {rows && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>{list.length} of {rows.length} users</p>
          <button className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".8rem" }} onClick={() => setMailOpen((v) => !v)}>{mailOpen ? "Close email" : `✉️ Email ${q.trim() ? "these" : "all"} ${list.length} user${list.length === 1 ? "" : "s"}`}</button>
        </div>
      )}
      {rows && mailOpen && (
        <div className="panel">
          <UserEmailBox ids={list.map((u) => u.id)} label={`Email ${list.length} user${list.length === 1 ? "" : "s"}${q.trim() ? " in this search" : ""}`} />
          <p style={{ fontSize: ".75rem", color: "var(--ink-soft)", marginTop: 8 }}>Free email plan: up to 100 emails a day. Type in the search box to email a smaller group.</p>
        </div>
      )}
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
