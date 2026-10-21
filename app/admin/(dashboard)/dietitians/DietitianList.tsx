"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DietitianActionButtons from "../DietitianActionButtons";

export type DtRow = {
  id: string; name: string; email: string; phone: string;
  status: "pending" | "approved" | "rejected"; portal: boolean;
  qualification: string; experienceYears: number; specializations: string[]; languages: string[];
  location: string; fee: number; feeText: string; about: string; joinedAt: string;
  total: number; thisMonth: number; clients: number; cancelled: number; waiting: number; plansSent: number;
  lastActive: number; activity: { at: number; what: string }[];
  upcoming: { date: string; time: string; client: string }[];
};

const SHARE = 0.85; // dietitian keeps 85%, Health365 keeps 15%
const rs = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const day = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const joined = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const ago = (t: number) => {
  if (!t) return "Never";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
};
const digits = (p: string) => p.replace(/\D/g, "").slice(-10);
const STATUS = { approved: ["Approved", "dl-ok"], pending: ["Waiting", "dl-wait"], rejected: ["Rejected", "dl-no"] } as const;

export default function DietitianList({ rows }: { rows: DtRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | DtRow["status"]>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");

  const count = (s: DtRow["status"]) => rows.filter((r) => r.status === s).length;
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .filter((r) => f === "all" || r.status === f)
      .filter((r) => !t || [r.name, r.email, r.phone, r.location, ...r.specializations].join(" ").toLowerCase().includes(t));
  }, [rows, q, f]);

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch {}
  };
  const portal = async (r: DtRow) => {
    setBusy(r.id);
    await fetch("/api/admin/consult-chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "portal", dietitianId: r.id, portal: !r.portal }) }).catch(() => null);
    setBusy("");
    router.refresh();
  };

  const approved = rows.filter((r) => r.status === "approved");
  const monthFees = approved.reduce((a, r) => a + r.fee * r.thisMonth, 0);

  return (
    <div className="dl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dl-stats">
        <div><small>Approved</small><b>{count("approved")}</b></div>
        <div><small>Waiting for approval</small><b style={{ color: count("pending") ? "var(--terracotta)" : undefined }}>{count("pending")}</b></div>
        <div><small>Consults this month</small><b>{approved.reduce((a, r) => a + r.thisMonth, 0)}</b></div>
        <div><small>Health365 share this month</small><b>{rs(monthFees * (1 - SHARE))}</b></div>
      </div>

      <input className="dl-search" placeholder="Search by name, phone, city or speciality" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search dietitians" />
      <div className="dl-chips">
        {([["all", `All ${rows.length}`], ["approved", `Approved ${count("approved")}`], ["pending", `Waiting ${count("pending")}`], ["rejected", `Rejected ${count("rejected")}`]] as const).map(([k, l]) => (
          <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>
        ))}
      </div>

      {list.length === 0 && <p className="dl-empty">{rows.length ? "No dietitian matches this search." : "No dietitians have applied yet."}</p>}

      {list.map((r) => {
        const isOpen = open === r.id;
        const ph = digits(r.phone);
        return (
          <div key={r.id} className={"dl-card" + (isOpen ? " open" : "")}>
            <button className="dl-head" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
              <span className="dl-av">{(r.name || "?")[0].toUpperCase()}</span>
              <span className="dl-t">
                <b>{r.name}</b>
                <small>{[r.location, r.experienceYears ? `${r.experienceYears} yrs` : "", r.feeText ? `Fee ${r.feeText}` : ""].filter(Boolean).join(" · ")}</small>
              </span>
              <span className="dl-right">
                <span className={"dl-pill " + STATUS[r.status][1]}>{STATUS[r.status][0]}</span>
                {r.status === "approved" && <small>{r.total} consult{r.total === 1 ? "" : "s"}{r.waiting ? ` · ${r.waiting} waiting` : ""}</small>}
              </span>
              <span className="dl-chev" aria-hidden>{isOpen ? "▴" : "▾"}</span>
            </button>

            {isOpen && (
              <div className="dl-body">
                <h4>Contact</h4>
                <div className="dl-contact">
                  <div className="dl-line"><span>Phone</span><b>{r.phone || "Not added"}</b>
                    {ph && (<span className="dl-acts">
                      <a href={`tel:+91${ph}`}>Call</a>
                      <a href={`https://wa.me/91${ph}`} target="_blank" rel="noopener">WhatsApp</a>
                      <button onClick={() => copy(r.phone, r.id + "p")}>{copied === r.id + "p" ? "Copied" : "Copy"}</button>
                    </span>)}
                  </div>
                  <div className="dl-line"><span>Email</span><b>{r.email}</b>
                    <span className="dl-acts"><a href={`mailto:${r.email}`}>Email</a><button onClick={() => copy(r.email, r.id + "e")}>{copied === r.id + "e" ? "Copied" : "Copy"}</button></span>
                  </div>
                </div>

                <h4>Profile</h4>
                <div className="dl-grid">
                  <div><span>Qualification</span><b>{r.qualification || "—"}</b></div>
                  <div><span>Experience</span><b>{r.experienceYears ? `${r.experienceYears} years` : "—"}</b></div>
                  <div><span>City</span><b>{r.location || "—"}</b></div>
                  <div><span>Fee per consult</span><b>{r.feeText || "—"}</b></div>
                  <div><span>Languages</span><b>{r.languages.join(", ") || "—"}</b></div>
                  <div><span>Applied on</span><b>{joined(r.joinedAt)}</b></div>
                </div>
                {r.specializations.length > 0 && <div className="dl-tags">{r.specializations.map((s) => <span key={s}>{s}</span>)}</div>}
                {r.about && <p className="dl-about">{r.about}</p>}

                {r.status === "approved" && (
                  <>
                    <h4>Work</h4>
                    <div className="dl-grid four">
                      <div><span>Total consults</span><b>{r.total}</b></div>
                      <div><span>This month</span><b>{r.thisMonth}</b></div>
                      <div><span>Clients</span><b>{r.clients}</b></div>
                      <div><span>Plans sent</span><b>{r.plansSent}</b></div>
                      <div><span>Waiting for reply</span><b style={{ color: r.waiting ? "var(--terracotta)" : undefined }}>{r.waiting}</b></div>
                      <div><span>Cancelled</span><b>{r.cancelled}</b></div>
                      <div><span>Last active</span><b>{ago(r.lastActive)}</b></div>
                      <div><span>App login</span><b>{r.portal ? "On" : "Off"}</b></div>
                    </div>

                    <h4>Money this month</h4>
                    <div className="dl-money">
                      <div><span>Consult fees</span><b>{rs(r.fee * r.thisMonth)}</b></div>
                      <div><span>Dietitian gets (85%)</span><b>{rs(r.fee * r.thisMonth * SHARE)}</b></div>
                      <div><span>Health365 keeps (15%)</span><b>{rs(r.fee * r.thisMonth * (1 - SHARE))}</b></div>
                    </div>
                    <p className="dl-note">Worked out from their listed fee. Coupons or discounts can make the real amount lower.</p>

                    <h4>Upcoming consults</h4>
                    {r.upcoming.length === 0 ? <p className="dl-empty sm">None booked.</p> : (
                      <ul className="dl-ul">{r.upcoming.map((u, i) => <li key={i}><b>{u.client}</b><span>{day(u.date)} · {u.time}</span></li>)}</ul>
                    )}

                    <h4>Recent activity</h4>
                    {r.activity.length === 0 ? <p className="dl-empty sm">Nothing yet.</p> : (
                      <ul className="dl-ul">{r.activity.map((a, i) => <li key={i}><b>{a.what}</b><span>{ago(a.at)}</span></li>)}</ul>
                    )}
                  </>
                )}

                <div className="dl-foot">
                  {r.status === "approved" && (
                    <button className="pill pill-outline" disabled={busy === r.id} onClick={() => portal(r)} style={{ padding: "8px 16px", fontSize: ".8rem" }}>
                      {busy === r.id ? "…" : r.portal ? "Turn off app login" : "Turn on app login"}
                    </button>
                  )}
                  <DietitianActionButtons id={r.id} status={r.status} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const CSS = `
.dl{margin-top:22px}
.dl-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dl-stats div{background:#fff;border-radius:16px;padding:14px 16px;border:1px solid var(--line)}
.dl-stats small{display:block;font-size:.72rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em}
.dl-stats b{display:block;font-size:1.5rem;margin-top:4px}
.dl-search{width:100%;margin-top:16px;padding:12px 16px;border-radius:14px;border:1px solid var(--line);background:#fff;font:inherit;font-size:.95rem}
.dl-chips{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 14px}
.dl-chips button{padding:7px 14px;border-radius:99px;border:1px solid var(--line);background:#fff;font-size:.82rem;font-weight:600;cursor:pointer}
.dl-chips button.on{background:var(--teal);border-color:var(--teal);color:#fff}
.dl-empty{color:var(--ink-soft);text-align:center;padding:30px 0}.dl-empty.sm{text-align:left;padding:2px 0;font-size:.88rem}
.dl-card{background:#fff;border:1px solid var(--line);border-radius:18px;margin-bottom:10px;overflow:hidden}
.dl-card.open{border-color:var(--teal)}
.dl-head{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:none;border:0;text-align:left;cursor:pointer;font:inherit}
.dl-av{width:42px;height:42px;border-radius:50%;background:var(--teal);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.dl-t{flex:1;min-width:0}.dl-t b{display:block;font-size:1rem}.dl-t small{display:block;color:var(--ink-soft);font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dl-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px}.dl-right small{font-size:.74rem;color:var(--ink-soft);white-space:nowrap}
.dl-pill{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
.dl-ok{background:#E3F1EC;color:var(--teal-deep)}.dl-wait{background:#FCEBDD;color:#A4511F}.dl-no{background:#EEE;color:#666}
.dl-chev{color:var(--ink-soft);font-size:.9rem;width:14px;text-align:center}
.dl-body{padding:4px 16px 16px;border-top:1px solid var(--line)}
.dl-body h4{font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);margin:16px 0 8px}
.dl-contact{display:flex;flex-direction:column;gap:8px}
.dl-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--paper);border-radius:12px;padding:10px 12px}
.dl-line>span:first-child{font-size:.78rem;color:var(--ink-soft);width:48px}.dl-line>b{flex:1 1 170px;min-width:0;overflow-wrap:anywhere}
.dl-acts{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
.dl-acts a,.dl-acts button{font-size:.78rem;font-weight:700;color:var(--teal-deep);background:#fff;border:1px solid var(--line);border-radius:99px;padding:6px 12px;cursor:pointer;text-decoration:none}
.dl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.dl-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}
.dl-grid div,.dl-money div{background:var(--paper);border-radius:12px;padding:10px 12px;min-width:0}
.dl-grid span,.dl-money span{display:block;font-size:.72rem;color:var(--ink-soft)}
.dl-grid b,.dl-money b{display:block;font-size:.92rem;margin-top:2px;overflow-wrap:anywhere}
.dl-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.dl-tags span{font-size:.76rem;font-weight:600;background:#E3F1EC;color:var(--teal-deep);padding:5px 11px;border-radius:99px}
.dl-about{margin-top:10px;font-size:.9rem;line-height:1.55;color:var(--ink-soft)}
.dl-money{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.dl-note{font-size:.76rem;color:var(--ink-soft);margin-top:6px}
.dl-ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.dl-ul li{display:flex;justify-content:space-between;gap:10px;background:var(--paper);border-radius:12px;padding:9px 12px;font-size:.88rem}
.dl-ul li span{color:var(--ink-soft);white-space:nowrap}
.dl-foot{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:16px}
@media (max-width:640px){
  .dl-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dl-grid,.dl-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dl-money{grid-template-columns:1fr}
  .dl-right small{display:none}
}
`;
