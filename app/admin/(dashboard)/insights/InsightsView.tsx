"use client";

import { useState } from "react";
import type { Insights } from "@/lib/insights";
import type { AppError } from "@/lib/appErrors";

interface FollowUp { apptId: string; userId: string; name: string; phone: string; email: string; dietitian: string; date: string; days: number }

const short = (d: string) => new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const ago = (ms: number) => { const d = Math.floor((Date.now() - ms) / 86400000); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };

function Tile({ n, label, hint }: { n: number | string; label: string; hint?: string }) {
  return (
    <div className="panel" style={{ padding: "18px 20px", margin: 0 }}>
      <p style={{ fontSize: "1.9rem", fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>{n}</p>
      <p style={{ fontSize: ".85rem", fontWeight: 600, marginTop: 8 }}>{label}</p>
      {hint && <p style={{ fontSize: ".75rem", color: "var(--ink-soft)", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

export default function InsightsView({ ins, followUps, errors, referred }: { ins: Insights; followUps: FollowUp[]; errors: AppError[]; referred: number }) {
  const [fu, setFu] = useState(followUps);
  const [errs, setErrs] = useState(errors);
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...ins.days.map((d) => d.active));
  const signups30 = ins.days.reduce((s, d) => s + d.signups, 0);
  const consults30 = ins.days.reduce((s, d) => s + d.consults, 0);

  const post = (body: object) => fetch("/api/admin/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const msg = (f: FollowUp) => encodeURIComponent(`Hi ${f.name.split(" ")[0]}, this is Health365 🌿 It's been ${f.days} days since your consultation with ${f.dietitian}. How is the plan going? Reply here if you have any questions, or book a quick follow-up in the app.`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="adm-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <Tile n={ins.dau} label="Opened the app today" />
        <Tile n={ins.wau} label="Active this week" hint="different phones, last 7 days" />
        <Tile n={ins.mau} label="Active this month" hint="last 30 days" />
        <Tile n={ins.installs} label="Phones that opened it" hint="since counting started" />
      </div>

      <div className="panel" style={{ margin: 0 }}>
        <h2 style={{ fontSize: "1.05rem" }}>App users per day</h2>
        <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4 }}>Last 30 days · tap or hover a bar for the numbers</p>
        <div style={{ position: "relative", marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160, borderBottom: "1px solid var(--line)" }}>
            {ins.days.map((d, i) => (
              <div key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}
                style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default" }}>
                <div style={{ width: "100%", height: `${(d.active / max) * 100}%`, minHeight: d.active ? 3 : 0, background: "#287379", opacity: hover === null || hover === i ? 1 : 0.45, borderRadius: "4px 4px 0 0", transition: "opacity .15s" }} />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div style={{ position: "absolute", top: -6, left: `min(calc(${(hover / ins.days.length) * 100}% ), calc(100% - 190px))`, background: "var(--ink)", color: "#fff", padding: "8px 12px", borderRadius: 10, fontSize: ".78rem", pointerEvents: "none", whiteSpace: "nowrap" }}>
              <b>{short(ins.days[hover].date)}</b> · {ins.days[hover].active} app users<br />
              {ins.days[hover].signups} sign-ups · {ins.days[hover].consults} consultations
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "var(--ink-soft)", marginTop: 6 }}>
            <span>{short(ins.days[0].date)}</span><span>{short(ins.days[ins.days.length - 1].date)}</span>
          </div>
        </div>
        <div className="adm-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 18, fontSize: ".85rem" }}>
          <p><b>{signups30}</b> sign-ups <span style={{ color: "var(--ink-soft)" }}>(30 days)</span></p>
          <p><b>{consults30}</b> consultations <span style={{ color: "var(--ink-soft)" }}>(30 days)</span></p>
          <p><b>{ins.totals.users}</b> accounts in total</p>
          <p><b>{referred}</b> joined with an invite code</p>
        </div>
        {ins.versions.length > 0 && (
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 12 }}>
            App versions: {ins.versions.map((v) => `${v.version} (${v.devices})`).join(" · ")}
          </p>
        )}
      </div>

      <div className="panel" style={{ margin: 0 }}>
        <h2 style={{ fontSize: "1.05rem" }}>🩺 Follow-ups due ({fu.length})</h2>
        <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4, marginBottom: 8 }}>Consultation 7–30 days ago and no new booking. A quick check-in keeps them on track — and often brings a repeat booking.</p>
        {fu.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>No one is due right now. 🎉</p>}
        {fu.map((f) => (
          <div key={f.apptId} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <p style={{ fontWeight: 700 }}>{f.name}</p>
              <p style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{f.days} days since consultation with {f.dietitian} ({short(f.date)}){f.phone ? ` · +91 ${f.phone}` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {f.phone && <a className="pill pill-primary" style={{ padding: "6px 14px", fontSize: ".8rem" }} target="_blank" rel="noreferrer" href={`https://wa.me/91${f.phone}?text=${msg(f)}`}>WhatsApp</a>}
              <button className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".8rem" }} onClick={async () => { await post({ action: "followupDone", apptId: f.apptId }); setFu(fu.filter((x) => x.apptId !== f.apptId)); }}>Done</button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ margin: 0 }}>
        <h2 style={{ fontSize: "1.05rem" }}>😴 Stopped opening the app ({ins.inactive.length})</h2>
        <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4, marginBottom: 8 }}>Logged-in users who haven&apos;t opened the app for 7+ days — most recent first.</p>
        {ins.inactive.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>Nobody yet.</p>}
        {ins.inactive.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", alignItems: "center", flexWrap: "wrap", fontSize: ".88rem" }}>
            <p style={{ flex: "1 1 240px" }}><b>{u.name}</b> <span style={{ color: "var(--ink-soft)" }}>· last opened {ago(u.lastSeen)} · {u.email}</span></p>
            {u.phone && <a className="pill pill-outline" style={{ padding: "5px 12px", fontSize: ".78rem" }} target="_blank" rel="noreferrer" href={`https://wa.me/91${u.phone}?text=${encodeURIComponent(`Hi ${u.name.split(" ")[0]}, we miss you at Health365 🌿 Your plan and progress are saved — open the app to pick up where you left off.`)}`}>WhatsApp</a>}
          </div>
        ))}
      </div>

      <div className="panel" style={{ margin: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: "1.05rem" }}>⚠️ App problems ({errs.length})</h2>
          {errs.length > 0 && <button className="pill pill-outline" style={{ padding: "5px 12px", fontSize: ".78rem" }} onClick={async () => { if (!confirm("Clear all problem reports?")) return; await post({ action: "clearErrors" }); setErrs([]); }}>Clear all</button>}
        </div>
        <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4, marginBottom: 8 }}>Errors the app hit on people&apos;s phones. Send a screenshot of any new one to your developer.</p>
        {errs.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>No problems reported. ✅</p>}
        {errs.map((e) => (
          <div key={e.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: ".85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button onClick={() => setOpen(open === e.id ? null : e.id)} style={{ background: "none", border: 0, textAlign: "left", cursor: "pointer", padding: 0, flex: 1 }}>
                <b>{e.msg}</b><br />
                <span style={{ color: "var(--ink-soft)", fontSize: ".78rem" }}>{e.count}× on {e.users} phone{e.users > 1 ? "s" : ""} · last {ago(e.last)} · v{e.version || "?"}{e.where ? ` · ${e.where}` : ""}</span>
              </button>
              <button onClick={async () => { await post({ action: "clearErrors", id: e.id }); setErrs(errs.filter((x) => x.id !== e.id)); }} style={{ background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer", fontSize: ".78rem" }}>Fixed ✓</button>
            </div>
            {open === e.id && <pre style={{ whiteSpace: "pre-wrap", fontSize: ".72rem", background: "rgba(0,0,0,.04)", padding: 10, borderRadius: 8, marginTop: 8, overflowX: "auto" }}>{e.stack || "(no details)"}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
