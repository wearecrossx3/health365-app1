import Link from "next/link";
import type { User, Consultation, Appointment, DietitianApplication } from "@/lib/kv";
import ConsultationRow from "./ConsultationRow";
import AppointmentRow from "./AppointmentRow";
import DietitianActionButtons from "./DietitianActionButtons";

// Home screen of the owner's Admin app: what needs attention today, in the
// same app style as the Dietitian app. "Full dashboard" opens the old page.
const ist = () => new Date(Date.now() + 5.5 * 3600e3);
const ACTIONS: [string, string, string][] = [
  ["/admin/app-notifications", "🔔", "Send notification"],
  ["/admin/plan-generator", "🍱", "Make a plan"],
  ["/admin/consult-chats", "💬", "Consult chats"],
  ["/admin/coupons", "🏷️", "Coupons"],
  ["/admin/offers", "🎁", "App offers"],
  ["/admin?full=1", "⚙️", "Alerts & setup"],
];

export default function OwnerHome({ name, users, needsReview, pending, appointments, consultations }: {
  name: string; users: User[]; needsReview: Consultation[]; pending: DietitianApplication[]; appointments: Appointment[]; consultations: number;
}) {
  const now = ist();
  const td = now.toISOString().slice(0, 10);
  const h = now.getUTCHours();
  const todays = appointments.filter((a) => a.date === td && a.status === "booked");
  const upcoming = appointments.filter((a) => a.date >= td && a.status === "booked").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const newToday = users.filter((u) => new Date(new Date(u.createdAt).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) === td).length;
  const first = (name || "").split(" ")[0];
  return (
    <div className="oh">
      <p className="oh-sub">{h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 22 ? "Good evening" : "Good night"},</p>
      <h1 className="oh-h1">{first || "Owner"} 👋</h1>

      <div className="oh-hero">
        <b>{todays.length ? `${todays.length} appointment${todays.length > 1 ? "s" : ""} today` : "No appointments today"}</b>
        <p>{needsReview.length || pending.length ? "A few things need you — see below." : "You're all caught up. 🌿"}</p>
        {todays.slice(0, 2).map((a) => (
          <div key={a.id} className="oh-next"><span className="oh-av">{(a.userName || "C")[0]}</span><span style={{ flex: 1, minWidth: 0 }}><b>{a.userName}</b><small>{a.time} · {a.dietitianName}</small></span></div>
        ))}
      </div>

      <div className="oh-stats">
        <div><small>Users</small><b>{users.length}</b><i>+{newToday} today</i></div>
        <div><small>To review</small><b style={{ color: needsReview.length ? "#E5394F" : undefined }}>{needsReview.length}</b><i>{consultations} forms</i></div>
        <div><small>Dietitians</small><b style={{ color: pending.length ? "#C27A12" : undefined }}>{pending.length}</b><i>waiting</i></div>
      </div>

      <div className="oh-act">
        {ACTIONS.map(([href, ic, l]) => <Link key={href} href={href}><span>{ic}</span>{l}</Link>)}
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="oh-sec">Dietitian requests</h2>
          {pending.map((d) => (
            <div key={d.id} className="oh-card">
              <b>{d.name}</b><small>{d.qualification} · {d.experienceYears} yrs · {d.location}</small>
              <div style={{ marginTop: 10 }}><DietitianActionButtons id={d.id} status={d.status} /></div>
            </div>
          ))}
        </>
      )}

      <h2 className="oh-sec">Needs your review</h2>
      {needsReview.length === 0 ? <p className="oh-empty">Nothing to review. 👍</p> : <div className="oh-list">{needsReview.slice(0, 6).map((c) => <ConsultationRow key={c.id} c={c} />)}</div>}

      <h2 className="oh-sec">Upcoming appointments</h2>
      {upcoming.length === 0 ? <p className="oh-empty">No upcoming appointments.</p> : <div className="oh-list">{upcoming.slice(0, 8).map((a) => <AppointmentRow key={a.id} a={a} />)}</div>}

      <Link href="/admin?full=1" className="oh-full">Full dashboard, alerts &amp; setup ›</Link>
      <style dangerouslySetInnerHTML={{ __html: `
.oh{padding:calc(20px + env(safe-area-inset-top)) 18px 10px;max-width:560px;margin:0 auto;color:#1F2B2C}
.oh-sub{color:#8A8F98;font-size:14px;margin:0}
.oh-h1{font-family:var(--font-instrument),Fredoka,sans-serif;font-weight:600;font-size:28px!important;margin:2px 0 0}
.oh-hero{background:#287379;color:#fff;border-radius:24px;padding:18px;margin-top:16px}
.oh-hero>b{font-family:var(--font-instrument),Fredoka;font-weight:600;font-size:19px}.oh-hero>p{font-size:13px;opacity:.85;margin-top:3px}
.oh-next{background:rgba(255,255,255,.14);border-radius:16px;padding:12px;margin-top:12px;display:flex;align-items:center;gap:10px}
.oh-next b{display:block;font-size:15px}.oh-next small{display:block;font-size:12px;opacity:.85}
.oh-av{width:40px;height:40px;border-radius:50%;background:#CBDB3D;color:#1F2B2C;display:grid;place-items:center;font-weight:700;flex:none}
.oh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.oh-stats div{background:#fff;border-radius:18px;padding:12px}.oh-stats small{display:block;font-size:11.5px;color:#8A8F98}
.oh-stats b{display:block;font-family:var(--font-instrument),Fredoka;font-size:24px;font-weight:600}.oh-stats i{font-style:normal;font-size:11px;color:#8A8F98}
.oh-act{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px}
.oh-act a{background:#fff;border-radius:18px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#1F2B2C;text-decoration:none;text-align:center;line-height:1.2}
.oh-act a span{font-size:21px;width:42px;height:42px;border-radius:14px;background:#FFF3E5;display:grid;place-items:center}
.oh-sec{font-family:var(--font-instrument),Fredoka;font-weight:600;font-size:18px!important;margin:22px 0 8px}
.oh-card{background:#fff;border-radius:18px;padding:13px;margin-bottom:8px}.oh-card b{display:block;font-size:15px}.oh-card small{color:#8A8F98;font-size:12.5px}
.oh-list{display:flex;flex-direction:column;gap:8px}
.oh-list>*{background:#fff!important;border:0!important;border-radius:18px!important}
.oh-empty{color:#8A8F98;font-size:14px;text-align:center;padding:14px 0;background:#fff;border-radius:18px}
.oh-full{display:block;text-align:center;margin-top:18px;background:#FFF3E5;color:#287379;font-weight:700;border-radius:16px;padding:14px;text-decoration:none;font-size:14px}
` }} />
    </div>
  );
}
