"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type PayRow = {
  id: string; client: string; phone: string; dietitian: string; date: string; time: string; bookedAt: string; booking: string;
  amount: number; utr: string; status: "unverified" | "verified" | "rejected"; checkedAt: string; checkedBy: string;
};

const LABEL = { unverified: ["To check", "py-wait"], verified: ["Received", "py-ok"], rejected: ["Not received", "py-no"] } as const;
const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
const day = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const rs = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function PaymentsList({ rows }: { rows: PayRow[] }) {
  const router = useRouter();
  const [f, setF] = useState<"unverified" | "verified" | "rejected" | "all">("unverified");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [err, setErr] = useState("");
  const n = (s: PayRow["status"]) => rows.filter((r) => r.status === s).length;
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .filter((r) => f === "all" || r.status === f)
      .filter((r) => !t || [r.client, r.phone, r.dietitian, r.utr, String(r.amount)].join(" ").toLowerCase().includes(t))
      .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
  }, [rows, f, q]);
  const sum = (s: PayRow["status"]) => rows.filter((r) => r.status === s).reduce((a, r) => a + r.amount, 0);

  const decide = async (r: PayRow, decision: PayRow["status"]) => {
    if (decision === "rejected" && !confirm(`Mark ₹${r.amount} from ${r.client} as NOT received? The booking will be cancelled.`)) return;
    setBusy(r.id); setErr("");
    const res = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, decision }) }).catch(() => null);
    setBusy("");
    if (!res || !res.ok) { setErr("Couldn't save. Try again."); return; }
    router.refresh();
  };
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(""), 1500); } catch {} };

  return (
    <div className="py">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="py-stats">
        <div><small>To check</small><b style={{ color: n("unverified") ? "var(--terracotta)" : undefined }}>{n("unverified")}</b><span>{rs(sum("unverified"))}</span></div>
        <div><small>Received</small><b>{n("verified")}</b><span>{rs(sum("verified"))}</span></div>
        <div><small>Not received</small><b>{n("rejected")}</b><span>{rs(sum("rejected"))}</span></div>
      </div>
      <input className="py-search" placeholder="Search by UTR, name, phone or amount" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search payments" />
      <div className="py-chips">
        {([["unverified", `To check ${n("unverified")}`], ["verified", `Received ${n("verified")}`], ["rejected", `Not received ${n("rejected")}`], ["all", `All ${rows.length}`]] as const).map(([k, l]) => (
          <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>
        ))}
      </div>
      {err && <p className="py-err">{err}</p>}
      {list.length === 0 && <p className="py-empty">{f === "unverified" ? "Nothing to check. 👍" : "No payments here."}</p>}
      {list.map((r) => (
        <div key={r.id} className="py-card">
          <div className="py-top">
            <div className="py-amt">{rs(r.amount)}</div>
            <span className={"py-pill " + LABEL[r.status][1]}>{LABEL[r.status][0]}</span>
          </div>
          <div className="py-utr">
            <span>UTR</span><b>{r.utr}</b>
            <button onClick={() => copy(r.utr)}>{copied === r.utr ? "Copied" : "Copy"}</button>
          </div>
          <div className="py-grid">
            <div><span>Client</span><b>{r.client}</b>{r.phone && <small>{r.phone}</small>}</div>
            <div><span>Dietitian</span><b>{r.dietitian}</b></div>
            <div><span>Consult</span><b>{day(r.date)} · {r.time}</b>{r.booking === "cancelled" && <small className="py-c">Cancelled</small>}</div>
            <div><span>Booked</span><b>{when(r.bookedAt)}</b></div>
          </div>
          {r.checkedAt && <p className="py-who">{LABEL[r.status][0]} · marked by {r.checkedBy} on {when(r.checkedAt)}</p>}
          <div className="py-btns">
            {r.status !== "verified" && <button className="pill pill-primary" disabled={busy === r.id} onClick={() => decide(r, "verified")}>✓ Received</button>}
            {r.status !== "rejected" && <button className="pill pill-outline py-x" disabled={busy === r.id} onClick={() => decide(r, "rejected")}>✗ Not received</button>}
            {r.status !== "unverified" && <button className="pill pill-outline" disabled={busy === r.id} onClick={() => decide(r, "unverified")}>Undo</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

const CSS = `
.py{margin-top:20px}
.py-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.py-stats div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px}
.py-stats small{display:block;font-size:.72rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em}
.py-stats b{display:block;font-size:1.5rem;margin-top:4px}.py-stats span{font-size:.85rem;color:var(--ink-soft)}
.py-search{width:100%;margin-top:16px;padding:12px 16px;border-radius:14px;border:1px solid var(--line);background:#fff;font:inherit;font-size:.95rem;box-sizing:border-box}
.py-chips{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 14px}
.py-chips button{padding:7px 14px;border-radius:99px;border:1px solid var(--line);background:#fff;font-size:.82rem;font-weight:600;cursor:pointer}
.py-chips button.on{background:var(--teal);border-color:var(--teal);color:#fff}
.py-empty{color:var(--ink-soft);text-align:center;padding:30px 0}.py-err{color:var(--terracotta);font-weight:600}
.py-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin-bottom:10px}
.py-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.py-amt{font-size:1.5rem;font-weight:800}
.py-pill{font-size:.75rem;font-weight:700;padding:4px 11px;border-radius:99px}
.py-wait{background:#FCEBDD;color:#A4511F}.py-ok{background:#E3F1EC;color:var(--teal-deep)}.py-no{background:#FBE3E3;color:#B3261E}
.py-utr{display:flex;align-items:center;gap:10px;background:var(--paper);border-radius:12px;padding:10px 12px;margin-top:10px;flex-wrap:wrap}
.py-utr span{font-size:.75rem;color:var(--ink-soft)}.py-utr b{font-size:1.1rem;letter-spacing:.06em;font-variant-numeric:tabular-nums;flex:1;min-width:140px}
.py-utr button{font-size:.78rem;font-weight:700;color:var(--teal-deep);background:#fff;border:1px solid var(--line);border-radius:99px;padding:6px 12px;cursor:pointer}
.py-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
.py-grid div{min-width:0}.py-grid span{display:block;font-size:.72rem;color:var(--ink-soft)}.py-grid b{display:block;font-size:.9rem;overflow-wrap:anywhere}
.py-grid small{display:block;font-size:.78rem;color:var(--ink-soft)}.py-grid .py-c{color:#B3261E;font-weight:700}
.py-who{font-size:.78rem;color:var(--ink-soft);margin-top:8px}
.py-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}
.py-btns .pill{padding:8px 16px;font-size:.82rem}.py-x{color:#B3261E!important;border-color:#E9B4B0!important}
@media (max-width:640px){.py-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.py-stats b{font-size:1.2rem}}
`;
