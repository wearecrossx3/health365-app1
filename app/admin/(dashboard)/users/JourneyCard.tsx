"use client";
import { useState } from "react";

// "Client journey": one place that answers — did they pay? did a dietitian
// reach out, who and when? what did the client actually receive?

export interface Journey {
  joinedVia: string;
  app: { onboarded: boolean; goal: string; conds: string[]; otherCond: string; pref: string; kg: number; allergies: string[]; activity: string; planTitle: string; planLocked?: boolean; lastActive: string; savedAt: number } | null;
  bookings: {
    id: string; dietitianName: string; date: string; time: string; status: string; createdAt: string;
    payment: { amount: number; status: string; checkedBy: string; checkedAt: string } | null;
    open: boolean; paid?: boolean; planOk?: boolean; free?: { by: string; reason: string } | null;
    chat: { client: number; dietitian: number; team: number; firstDtAt: number; lastAt: number; lastFrom: string; clientRead: number; recent: { from: string; text: string; at: number }[] };
    rating: { stars: number; comment: string } | null; ratingAsked: boolean;
  }[];
  sent: { at: number; via: string; what: string; ok: boolean; err?: string }[];
  dietitians?: { id: string; name: string }[];
}

const GOAL: Record<string, string> = { lose: "Lose weight", gain: "Gain weight", maintain: "Maintain", condition: "Manage a condition" };
const COND: Record<string, string> = { diabetes: "Diabetes", pcos: "PCOS", thyroid: "Thyroid", weight: "Weight management", cholesterol: "Cholesterol", digestive: "Digestive health", oncology: "Cancer care" };
const PREF: Record<string, string> = { veg: "Vegetarian", egg: "Eggetarian", nonveg: "Non-veg", jain: "Jain", vegan: "Vegan" };
const when = (ms: number) => (ms ? new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
const day = (s: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const gap = (a: number, b: number) => { const h = Math.round((b - a) / 36e5); return h < 1 ? "within an hour" : h < 48 ? `${h} h later` : `${Math.round(h / 24)} days later`; };
const WHO: Record<string, string> = { client: "Client", dietitian: "Dietitian", team: "Health365" };

function Step({ ok, icon, title, children }: { ok: "yes" | "no" | "wait"; icon: string; title: string; children?: React.ReactNode }) {
  const col = ok === "yes" ? "#1E7A4F" : ok === "wait" ? "#B7791F" : "#8A8F8C";
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
      <span style={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: 99, display: "grid", placeItems: "center", background: ok === "yes" ? "#E5F3EB" : ok === "wait" ? "#FBF1DD" : "#F0F0EE", fontSize: 15 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ color: col }}>{title}</b>
        {children && <div style={{ fontSize: ".86rem", color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.5 }}>{children}</div>}
      </div>
    </div>
  );
}

export default function JourneyCard({ j, userId, onChanged, createdAt, consultations, plans }: { j: Journey; userId: string; onChanged: () => void; createdAt: string; consultations: { goal: string; conditions: string[]; createdAt: string }[]; plans: { title: string; assignedBy: string; assignedAt: string }[] }) {
  const a = j.app;
  const [busy, setBusy] = useState("");
  async function del(id: string, label: string) {
    if (!confirm(`Delete the booking “${label}”?\n\nThis removes the booking, its chat, rating and reminders for everyone — the client app, the dietitian app and admin. Use it for test bookings. It can't be undone.`)) return;
    setBusy(id);
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "deleteBooking", apptId: id }) });
    setBusy("");
    if (!r.ok) { alert("Couldn't delete — please try again."); return; }
    onChanged();
  }
  async function mark(id: string, decision: "markPaid" | "markFree") {
    if (!confirm(decision === "markPaid" ? "Mark this booking as PAID (cash / bank / other)? The chat opens and the dietitian can send a plan." : "Give this consultation FREE? The chat opens and the dietitian can send a plan.")) return;
    setBusy(id);
    const r = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision }) });
    setBusy("");
    if (!r.ok) { alert("Couldn't save — please try again."); return; }
    onChanged();
  }
  // Paid outside the app (cash, another UPI, bank transfer).
  const [payOpen, setPayOpen] = useState(false);
  const [payDt, setPayDt] = useState("");
  const [payAmt, setPayAmt] = useState("");
  const [payHow, setPayHow] = useState("Cash");
  const [payNote, setPayNote] = useState("");
  const [payMsg, setPayMsg] = useState("");
  async function recordPayment(apptId?: string) {
    if (!apptId && !payDt) { setPayMsg("Pick the dietitian."); return; }
    const amount = Number(payAmt) || 0;
    if (!confirm(`Record ${amount ? `₹${amount} ` : ""}${payHow} payment${apptId ? " for this booking" : ` and open a consultation with ${(j.dietitians || []).find((d) => d.id === payDt)?.name || "the dietitian"}`}?\n\nThe chat opens and the dietitian can send a custom diet plan.`)) return;
    setBusy(apptId || "pay"); setPayMsg("");
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "recordPayment", apptId, dietitianId: payDt, amount, how: payHow, note: payNote }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) { setPayMsg(d.error || "Couldn't save — please try again."); return; }
    setPayOpen(false); setPayAmt(""); setPayNote(""); setPayMsg("");
    onChanged();
  }
  const payForm = (apptId?: string) => (
    <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: "#F6F4EE", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: ".85rem" }}>
      {!apptId && (
        <select value={payDt} onChange={(e) => setPayDt(e.target.value)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }}>
          <option value="">Dietitian…</option>
          {(j.dietitians || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}
      <input value={payAmt} onChange={(e) => setPayAmt(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Amount ₹" style={{ width: 100, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }} />
      <select value={payHow} onChange={(e) => setPayHow(e.target.value)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }}>
        {["Cash", "Other UPI", "Bank transfer", "Card"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <input value={payNote} onChange={(e) => setPayNote(e.target.value)} maxLength={80} placeholder="Note (optional), e.g. paid to Sagar's UPI" style={{ flex: "1 1 180px", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }} />
      <button disabled={!!busy} onClick={() => recordPayment(apptId)} className="pill pill-primary" style={{ padding: "8px 14px", fontSize: ".85rem" }}>{busy ? "Saving…" : "✓ Record payment"}</button>
      {payMsg && <span style={{ color: "#B03A2E", width: "100%" }}>{payMsg}</span>}
    </div>
  );
  const [payFor, setPayFor] = useState("");
  const latestForm = [...consultations].sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt))[0];
  const conds = a?.conds.length ? a.conds.map((c) => COND[c] || c) : latestForm?.conditions || [];
  const paid = j.bookings.filter((b) => b.status === "booked" && b.paid !== false);
  return (
    <div className="panel">
      <h2 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Client journey</h2>
      <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginBottom: 6 }}>What this person has done, and what Health365 and the dietitian have done for them.</p>

      <Step ok="yes" icon="👤" title={`Joined ${day(createdAt)}`}>Signed up with {j.joinedVia}.</Step>

      <Step ok={a?.onboarded || latestForm ? "yes" : "no"} icon="📝" title={a?.onboarded || latestForm ? "Filled their profile in the app" : "Hasn't finished the app profile"}>
        {(a || latestForm) && <>
          {a?.goal && <>Goal: <b>{GOAL[a.goal] || a.goal}</b> · </>}
          {conds.length > 0 && <>Condition: <b>{conds.join(", ")}</b>{a?.otherCond ? ` (${a.otherCond})` : ""} · </>}
          {a?.pref && <>{PREF[a.pref] || a.pref} · </>}
          {a?.kg ? <>{a.kg} kg · </> : null}
          {a?.allergies.length ? <>Allergies: {a.allergies.join(", ")}</> : null}
          <br /><i>This is the free profile form from the app — it is not a paid consultation and no dietitian is assigned from it.</i>
        </>}
      </Step>

      <Step ok={a?.planTitle ? "yes" : a?.planLocked ? "wait" : "no"} icon="🥗" title={a?.planTitle ? "Has a diet plan in the app" : a?.planLocked ? "No free plan: has a health condition, needs a dietitian" : "No diet plan in the app yet"}>
        {a?.planTitle && <>Showing “{a.planTitle}”. </>}
        {a?.planLocked && <>The app shows “Your plan needs a dietitian” and a Book a consultation button instead of a plan. The plan opens only when a dietitian sends one. </>}
        {a?.lastActive ? <>Last logged food/progress on {day(a.lastActive)}.</> : a ? "Hasn't logged any food or progress yet." : "The app hasn't saved anything for this account yet."}
      </Step>

      {j.bookings.length === 0 ? (
        <Step ok="no" icon="💳" title="No dietitian consultation booked">
          No payment made and no dietitian assigned. So far they have only used the free app — no dietitian has contacted them.
        </Step>
      ) : j.bookings.map((b) => {
        const pay = b.payment;
        const payTxt = b.free ? `Approved without UPI — ${b.free.reason} (${b.free.by})` : !pay ? (b.paid === false ? "No payment yet — chat and plans stay closed until it is paid" : "No payment needed (booked before payments were required)") : pay.status === "verified" ? `₹${pay.amount} paid — confirmed${pay.checkedBy ? ` by ${pay.checkedBy}` : ""}${pay.checkedAt ? ` on ${day(pay.checkedAt)}` : ""}` : pay.status === "rejected" ? `₹${pay.amount} payment rejected` : `₹${pay.amount} — waiting for you to confirm the UPI payment (Admin › Payments)`;
        const dtOk = b.chat.dietitian > 0;
        return (
          <div key={b.id}>
            <Step ok={b.paid !== false ? "yes" : pay?.status === "rejected" ? "no" : "wait"} icon="💳" title={`Booked ${b.dietitianName} for ${b.date} ${b.time}${b.status !== "booked" ? ` (${b.status})` : ""}`}>
              {payTxt}{b.planOk === false && b.paid !== false ? " — chat is open, but custom plans stay locked until you mark it paid or free" : ""}. Booked on {day(b.createdAt)}.{" "}
              {b.planOk === false && b.status === "booked" && (<>
                <button disabled={busy === b.id} onClick={() => setPayFor(payFor === b.id ? "" : b.id)} style={{ background: "none", border: "none", padding: 0, color: "#287379", fontWeight: 700, cursor: "pointer", fontSize: ".82rem", marginRight: 10 }}>💵 Paid outside the app</button>
                <button disabled={busy === b.id} onClick={() => mark(b.id, "markFree")} style={{ background: "none", border: "none", padding: 0, color: "#287379", fontWeight: 700, cursor: "pointer", fontSize: ".82rem", marginRight: 10 }}>🎁 Give free</button>
              </>)}
              {payFor === b.id && payForm(b.id)}
              <button disabled={busy === b.id} onClick={() => del(b.id, `${b.dietitianName}, ${b.date}`)} style={{ background: "none", border: "none", padding: 0, color: "#B03A2E", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}>{busy === b.id ? "Deleting…" : "🗑 Delete booking"}</button>
            </Step>
            <Step ok={dtOk ? "yes" : b.open ? "wait" : "no"} icon="💬" title={dtOk ? `${b.dietitianName} replied${b.chat.firstDtAt ? ` — first on ${when(b.chat.firstDtAt)} (${gap(Date.parse(b.createdAt), b.chat.firstDtAt)})` : ""}` : b.open ? `${b.dietitianName} hasn't written yet` : "Chat not open"}>
              {b.chat.client} message{b.chat.client === 1 ? "" : "s"} from the client · {b.chat.dietitian} from the dietitian · {b.chat.team} from Health365.
              {b.chat.lastAt ? <> Last: {WHO[b.chat.lastFrom] || b.chat.lastFrom}, {when(b.chat.lastAt)}{b.chat.clientRead >= b.chat.lastAt ? " — client has seen it" : b.chat.lastFrom !== "client" ? " — client hasn't opened it yet" : ""}.</> : null}
              {!b.open && pay && pay.status !== "verified" && " The chat opens after the payment is confirmed."}
              {b.chat.recent.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: "pointer", color: "#287379", fontWeight: 600 }}>Latest messages</summary>
                  {b.chat.recent.map((m, i) => <p key={i} style={{ margin: "4px 0" }}><b>{WHO[m.from] || m.from}</b> · {when(m.at)}: {m.text}</p>)}
                </details>
              )}
            </Step>
            {(b.rating || b.ratingAsked) && (
              <Step ok={b.rating ? "yes" : "wait"} icon="⭐" title={b.rating ? `Rated ${"★".repeat(b.rating.stars)}${"☆".repeat(5 - b.rating.stars)}` : "Asked for a rating — no answer yet"}>{b.rating?.comment ? `“${b.rating.comment}”` : null}</Step>
            )}
          </div>
        );
      })}

      <Step ok="wait" icon="💵" title="Paid you outside the app?">
        Cash, another UPI or a bank transfer: record it here. A paid consultation opens with the dietitian you pick, the chat opens, and they can send a custom diet plan.{" "}
        {!payOpen ? <button onClick={() => setPayOpen(true)} style={{ background: "none", border: "none", padding: 0, color: "#287379", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}>+ Record a payment</button> : payForm()}
      </Step>

      <Step ok={plans.length ? "yes" : paid.length ? "wait" : "no"} icon="📋" title={plans.length ? `${plans.length} plan${plans.length > 1 ? "s" : ""} sent by the team/dietitian` : paid.length ? "Paid, but no plan sent yet" : "No plan sent by a dietitian"}>
        {plans.slice(0, 3).map((p, i) => <span key={i}>“{p.title}” by {p.assignedBy} on {day(p.assignedAt)}<br /></span>)}
      </Step>

      <Step ok={j.sent.length ? "yes" : "no"} icon="📬" title={j.sent.length ? "What reached their email / WhatsApp" : "No emails or WhatsApp sent to them yet"}>
        {j.sent.slice(0, 10).map((x, i) => (
          <span key={i}>{x.via === "email" ? "✉️" : "🟢"} {when(x.at)} — {x.what}{x.ok ? "" : ` (failed${x.err ? `: ${x.err}` : ""})`}<br /></span>
        ))}
        <span style={{ fontSize: ".76rem" }}>Chat messages show inside the app and on their website dashboard. This list started on 30 Oct 2026.</span>
      </Step>
    </div>
  );
}
