"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlanBuilder, { Plan } from "../(dashboard)/plan-generator/PlanBuilder";
import { TPL, fillTpl, Lang } from "@/lib/chatTemplates";
import DietitianTermsText from "@/components/DietitianTermsText";

type Profile = { goal: string; conditions: string[]; diet: string } | null;
type Row = { id: string; clientName: string; date: string; time: string; status: string; open: boolean; unread: number; lastText: string; lastFrom: string; lastAt: number; outcome: string; bookedAt?: number; profile: Profile };
type Msg = { id: string; from: "client" | "dietitian" | "team"; text: string; img?: string; at: number; flagged?: boolean };
type Detail = {
  thread: { id: string; client: string; date: string; time: string; status: string; open: boolean; note: string; outcome: string };
  profile: { goal: string; diet: string; conditions: string[]; allergens: string[]; answers: [string, string][]; at: string } | null;
  plans: { id: string; title: string; at: string; active: boolean; targetKcal: number; plan: Plan }[];
  messages: Msg[];
};
type View = { kind: "chat" | "client" | "plan"; id: string; copy?: Plan | null } | null;

const COLORS = ["#F6961D", "#9997C9", "#4EAA67", "#287379", "#E5394F", "#C27A12"];
const color = (s: string) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const mins = (t: string) => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ""); if (!m) return 0; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
// 5–11 morning, 12–16 afternoon, 17–21 evening, otherwise night (it's often past midnight when people reply).
const greet = (h: number) => (h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 22 ? "Good evening" : "Good night");
const dayLabel = (d: string) => (d === today() ? "Today" : new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };
const COND: Record<string, string> = { diabetes: "Diabetes", pcos: "PCOS", thyroid: "Thyroid", cholesterol: "Cholesterol", digestive: "Digestive", weight: "Weight", oncology: "Cancer care" };
const cond = (c: string) => COND[c] || c;
const OUT: [string, string][] = [["", "Open"], ["done", "Done"], ["follow-up", "Follow-up"], ["no-show", "No reply"]];
const QUICK = ["How are you feeling today?", "Please share your latest reports 📄", "Great progress, keep going! 💪"];

const I = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg>,
  chat: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" /><path d="M8 10h8M8 13h5" /></svg>,
  clients: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.6" /><path d="M17 14.2c2.7.2 4.5 2.2 4.5 5" /></svg>,
  me: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1"><circle cx="12" cy="8" r="4.5" /><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7" /></svg>,
};

export default function DietitianApp() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [me, setMe] = useState({ name: "", fee: 0 });
  const [earn, setEarn] = useState({ fee: 0, thisMonth: 0, total: 0 });
  const [tab, setTab] = useState<"today" | "chats" | "clients" | "me">("today");
  const [view, setView] = useState<View>(null);
  const [terms, setTerms] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const r = await fetch("/api/admin/my-clients", { cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) return;
    const d = await r.json();
    setRows(d.threads); setMe(d.me); setEarn(d.earnings); setTerms(!!d.termsNeeded);
  };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  // "New booking" pop-up: bookings this dietitian hasn't seen yet (remembered on this phone).
  const [fresh, setFresh] = useState<Row[]>([]);
  useEffect(() => {
    if (!rows) return;
    let seen = 0;
    try { seen = Number(localStorage.getItem("dt_seen_booking") || 0); } catch {}
    if (!seen) seen = Date.now() - 24 * 3600e3;
    const n = rows.filter((r) => r.status === "booked" && (r.bookedAt || 0) > seen && r.date >= today());
    setFresh(n.sort((a, b) => (b.bookedAt || 0) - (a.bookedAt || 0)));
  }, [rows]);
  const seenAll = () => {
    const max = Math.max(Date.now(), ...fresh.map((r) => r.bookedAt || 0));
    try { localStorage.setItem("dt_seen_booking", String(max)); } catch {}
    setFresh([]);
  };
  useEffect(() => { window.scrollTo(0, 0); }, [tab, view]);

  const unread = (rows || []).filter((r) => r.unread).length;
  const first = (me.name || "").replace(/^(dt\.?|dr\.?)\s+/i, "").split(" ")[0];
  const hour = new Date().getHours();

  const back = () => { setView(null); load(); };

  if (!rows) return <div className="dta"><Style /><p className="dta-empty" style={{ paddingTop: 120 }}>Loading…</p></div>;

  if (terms) return <div className="dta"><Style /><TermsGate onDone={() => setTerms(false)} /></div>;
  if (view?.kind === "chat") return <div className="dta"><Style /><Chat id={view.id} row={rows.find((r) => r.id === view.id)} me={me.name} onBack={back} onOpen={(k) => setView({ kind: k, id: view.id })} /></div>;
  if (view?.kind === "client") return <div className="dta"><Style /><Client id={view.id} onBack={back} onChat={() => setView({ kind: "chat", id: view.id })} onPlan={(copy) => setView({ kind: "plan", id: view.id, copy })} /></div>;
  if (view?.kind === "plan") {
    const r = rows.find((x) => x.id === view.id);
    return (
      <div className="dta"><Style />
        <div className="dta-top"><button className="dta-back" onClick={() => setView({ kind: "client", id: view.id })}>‹</button><div><b>New plan</b><small>for {r?.clientName}</small></div></div>
        <div className="dta-pb">
          <PlanFor id={view.id} name={r?.clientName || ""} copy={view.copy || null} onDone={() => setTimeout(() => setView({ kind: "chat", id: view.id }), 1200)} />
        </div>
      </div>
    );
  }
  const td = today();
  const todays = rows.filter((r) => r.date === td && r.status === "booked");
  const waiting = rows.filter((r) => r.unread).sort((a, b) => a.lastAt - b.lastAt);
  const follow = rows.filter((r) => r.outcome === "follow-up" && r.open);
  const upcoming = rows.filter((r) => r.status === "booked" && r.date >= td && !(r.date === td && todays.includes(r))).sort((a, b) => a.date.localeCompare(b.date) || mins(a.time) - mins(b.time));
  const isNew = (r: Row) => !!r.bookedAt && Date.now() - r.bookedAt < 48 * 3600e3 && r.lastFrom !== "dietitian";
  const list = rows
    .filter((r) => !q || r.clientName.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => filter === "all" || (filter === "unread" && r.unread) || (filter === "today" && r.date === td) || (filter === "follow" && r.outcome === "follow-up"));

  const item = (r: Row, right?: React.ReactNode, sub?: string, onClick = () => setView({ kind: "chat", id: r.id })) => (
    <button key={r.id} className={"dta-it" + (r.open ? "" : " dim")} onClick={onClick}>
      <span className="dta-av" style={{ background: r.open ? color(r.clientName) : "#a39c92" }}>{r.clientName[0]}</span>
      <span className="dta-t"><b>{r.clientName}</b><span>{sub ?? (r.open ? (r.lastText ? (r.lastFrom === "dietitian" ? "You: " : "") + r.lastText : "No messages yet — say hello 👋") : `Chat closed · ${fmtDate(r.date)}`)}</span></span>
      {right ?? (r.unread ? <span className="dta-dot" /> : r.outcome ? <span className={"dta-tag o-" + r.outcome}>{OUT.find((o) => o[0] === r.outcome)?.[1]}</span> : null)}
    </button>
  );

  return (
    <div className="dta"><Style />
      {fresh.length > 0 && (
        <div className="dta-sh dta-pop" onClick={seenAll}>
          <div className="dta-shb" onClick={(e) => e.stopPropagation()}>
            <div className="dta-shh"><b>{fresh.length > 1 ? `${fresh.length} new bookings 🎉` : "New booking 🎉"}</b><button className="dta-x" aria-label="Close" onClick={seenAll}>✕</button></div>
            <p className="dta-sub" style={{ margin: "2px 0 10px" }}>Say hello so they know you’ve seen it.</p>
            {fresh.slice(0, 4).map((r) => (
              <div key={r.id} className="dta-nb">
                <span className="dta-av" style={{ background: color(r.clientName) }}>{r.clientName[0]}</span>
                <span style={{ flex: 1, minWidth: 0 }}><b>{r.clientName}</b><small>{dayLabel(r.date)} · {r.time}{r.profile?.goal ? " · " + r.profile.goal : ""}</small></span>
                <button className="dta-lime" onClick={() => { seenAll(); setView({ kind: "chat", id: r.id }); }}>Open chat</button>
              </div>
            ))}
            <button className="dta-ok" onClick={seenAll}>OK, got it</button>
          </div>
        </div>
      )}
      <div className="dta-sc">
        {tab === "today" && (
          <>
            <p className="dta-sub">{greet(hour)},</p>
            <h1>{first || "Doctor"} 👋</h1>
            <div className="dta-hero">
              <b>{todays.length ? `${todays.length} consultation${todays.length > 1 ? "s" : ""} today` : upcoming.length ? `Next: ${upcoming[0].clientName} · ${dayLabel(upcoming[0].date)}, ${upcoming[0].time}` : "No consultations today"}</b>
              <p>{waiting.length ? "Clients are waiting in chat — reply within a few hours." : "You're all caught up. 🌿"}</p>
              {todays.slice(0, 2).map((r) => (
                <div key={r.id} className="dta-next">
                  <span className="dta-av" style={{ background: color(r.clientName) }}>{r.clientName[0]}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><b>{r.clientName}</b><small>{r.time}{r.profile?.conditions?.length ? " · " + r.profile.conditions.map(cond).join(", ") : ""}{r.profile?.goal ? " · " + r.profile.goal : ""}</small></span>
                  <button className="dta-lime" onClick={() => setView({ kind: "chat", id: r.id })}>Open chat</button>
                </div>
              ))}
            </div>
            <div className="dta-stats">
              <div><small>New messages</small><b style={{ color: unread ? "var(--red)" : undefined }}>{unread}</b></div>
              <div><small>Follow-ups due</small><b>{follow.length}</b></div>
              <div><small>This month</small><b>{earn.thisMonth}</b></div>
            </div>
            {upcoming.length > 0 && (<><h2 className="dta-sec">Upcoming consultations</h2>{upcoming.slice(0, 5).map((r) => item(r, isNew(r) ? <span className="dta-tag new">New</span> : <span className="dta-soft">{r.time}</span>, `${dayLabel(r.date)} · ${r.time}${r.profile?.goal ? " · " + r.profile.goal : ""}`))}</>)}
            <h2 className="dta-sec">Needs your reply {waiting.length > 0 && <button onClick={() => { setTab("chats"); setFilter("unread"); }}>See all</button>}</h2>
            {waiting.length === 0 ? <p className="dta-empty">No one is waiting. 👍</p> : waiting.slice(0, 4).map((r) => item(r, <span className="dta-tag late">{ago(r.lastAt)}</span>))}
            {follow.length > 0 && (<><h2 className="dta-sec">Follow-ups due</h2>{follow.map((r) => item(r, <span className="dta-soft">Message</span>, "Check how they're doing"))}</>)}
          </>
        )}

        {tab === "chats" && (
          <>
            <h1>Chats</h1><p className="dta-sub">Only your own clients</p>
            <input className="dta-search" placeholder="🔍  Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="dta-chips">
              {[["all", "All"], ["unread", `Unread${unread ? " " + unread : ""}`], ["today", "Today"], ["follow", "Follow-up"]].map(([k, l]) => (
                <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>{list.length === 0 ? <p className="dta-empty">Nothing here yet.</p> : list.map((r) => item(r))}</div>
          </>
        )}

        {tab === "clients" && (
          <>
            <h1>Clients</h1><p className="dta-sub">{rows.length} client{rows.length === 1 ? "" : "s"} booked with you</p>
            <input className="dta-search" placeholder="🔍  Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ marginTop: 14 }}>
              {rows.filter((r) => !q || r.clientName.toLowerCase().includes(q.toLowerCase())).map((r) =>
                item(r, <span className="dta-chev">›</span>, [fmtDate(r.date), r.profile?.goal, ...(r.profile?.conditions || []).map(cond)].filter(Boolean).join(" · "), () => setView({ kind: "client", id: r.id })))}
              {rows.length === 0 && <p className="dta-empty">When a client books you, they appear here.</p>}
            </div>
          </>
        )}

        {tab === "me" && (
          <>
            <h1>Me</h1>
            <div className="dta-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="dta-av" style={{ background: color(me.name || "D"), width: 56, height: 56, fontSize: 22 }}>{(first || "D")[0]}</span>
              <div><b style={{ fontSize: 18 }}>{me.name}</b><p className="dta-sub" style={{ margin: 0 }}>Health365 dietitian</p></div>
            </div>
            <div className="dta-stats">
              <div><small>This month</small><b>{earn.thisMonth}</b></div>
              <div><small>All clients</small><b>{earn.total}</b></div>
              <div><small>Your fee</small><b>{earn.fee ? `₹${earn.fee}` : "—"}</b></div>
            </div>
            <div className="dta-card"><h3>How it works</h3>
              <ul className="dta-ul">
                <li>Clients book you in the Health365 app or website.</li>
                <li>The consultation happens here in chat — they can send reports and photos.</li>
                <li>Send their diet plan from the client&apos;s page; it appears in their app.</li>
                <li>Phone numbers, emails and links are hidden in chat to keep clients and you safe.</li>
              </ul>
            </div>
            <button className="dta-out" onClick={async () => { await fetch("/api/auth/admin-logout", { method: "POST" }); location.href = "/admin/login"; }}>Log out</button>
          </>
        )}
      </div>

      <nav className="dta-nav">
        {([["today", "Today", I.home], ["chats", "Chats", I.chat], ["clients", "Clients", I.clients], ["me", "Me", I.me]] as const).map(([k, l, ic]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setQ(""); if (k !== "chats") setFilter("all"); }}>
            {ic}{l}{k === "chats" && unread > 0 && tab !== "chats" && <span className="nd" />}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Plan builder pre-filled from the client's form (goal, food, conditions, calories).
function PlanFor({ id, name, copy, onDone }: { id: string; name: string; copy: Plan | null; onDone: () => void }) {
  const [sug, setSug] = useState<{ goal: string; diet: string; conditions: string[]; kcal: number; basis: string } | null | undefined>(undefined);
  useEffect(() => {
    fetch(`/api/admin/my-clients/${id}`, { cache: "no-store" }).then((r) => r.json()).then((j) => setSug(j.suggest || null)).catch(() => setSug(null));
  }, [id]);
  if (sug === undefined) return <p className="dta-empty">Loading…</p>;
  return (
    <PlanBuilder fixedUser={{ id, name, email: "", phone: "" }} initialPlan={copy} initialInput={sug}
      portal={{ generateUrl: "/api/admin/my-clients/generate", assignUrl: `/api/admin/my-clients/${id}` }} onAssigned={onDone} />
  );
}

function Chat({ id, row, me, onBack, onOpen }: { id: string; row?: Row; me: string; onBack: () => void; onOpen: (k: "client" | "plan") => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [zoom, setZoom] = useState("");
  const [sheet, setSheet] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const n = useRef(0);
  const load = async () => {
    const r = await fetch(`/api/admin/my-clients/${id}`, { cache: "no-store" }).catch(() => null);
    if (r && r.ok) setD(await r.json());
  };
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (d && d.messages.length !== n.current) { n.current = d.messages.length; endRef.current?.scrollIntoView({ block: "end" }); } }, [d]);
  async function send(body: { text?: string; image?: string }) {
    setBusy(true); setNote("");
    const r = await fetch(`/api/admin/my-clients/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setNote(j.error || "Couldn't send."); return; }
    if (body.text !== undefined) setText("");
    if (j.masked) setNote("Phone numbers, emails and links are hidden — keep the conversation inside Health365.");
    load();
  }
  const name = d?.thread.client || row?.clientName || "";
  const p = d?.profile;
  const img = (m: string) => `/api/consult-chat/img/${id}/${m}`;
  return (
    <div className="dta-chat">
      <div className="dta-top">
        <button className="dta-back" onClick={onBack}>‹</button>
        <span className="dta-av" style={{ background: color(name || "C"), width: 38, height: 38, fontSize: 15 }}>{name[0]}</span>
        <div style={{ flex: 1, minWidth: 0 }}><b>{name}</b><small>{d ? `Booked ${fmtDate(d.thread.date)} · ${d.thread.time}` : ""}</small></div>
        <button className="dta-teal" onClick={() => onOpen("plan")}>📋 Plan</button>
      </div>
      <button className="dta-pills" onClick={() => onOpen("client")}>
        {p?.goal && <span className="dta-tag g1">{p.goal}</span>}
        {(p?.conditions || []).map((c) => <span key={c} className="dta-tag g2">{cond(c)}</span>)}
        {p?.diet && <span className="dta-tag g3">{p.diet}</span>}
        {!p && <span className="dta-sub" style={{ margin: 0, fontSize: 12.5 }}>No form yet — ask in chat</span>}
        <span className="dta-more">Details ›</span>
      </button>
      <div className="dta-msgs">
        {!d ? <p className="dta-empty">Loading…</p> : d.messages.length === 0 ? <p className="dta-empty">No messages yet. Say hello 👋</p> :
          d.messages.map((m) => {
            const t = new Date(m.at);
            const time = t.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
            if (m.from === "team") return <div key={m.id} className="dta-m team"><b>Health365</b>{m.text}</div>;
            return (
              <div key={m.id} className={"dta-m " + (m.from === "dietitian" ? "d" : "c") + (m.img && !m.text ? " ph" : "")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.img && <img src={img(m.img)} alt="Photo" onClick={() => setZoom(img(m.img!))} />}
                {m.text}
                <small>{time}{m.flagged ? " · contact details hidden" : ""}</small>
              </div>
            );
          })}
        <div ref={endRef} />
      </div>
      {d && !d.thread.open ? <p className="dta-closed">This chat closed 30 days after the consultation. The client can book again to continue.</p> : (
        <>
          {note && <p className="dta-note">{note}</p>}
          <div className="dta-qr"><button className="tp" onClick={() => setSheet(true)}>📝 Messages</button>{QUICK.map((qq) => <button key={qq} disabled={busy} onClick={() => send({ text: qq })}>{qq}</button>)}</div>
          <div className="dta-bar">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { const u = await shrink(f).catch(() => ""); if (u) send({ image: u }); else setNote("Couldn't read that photo."); } }} />
            <button className="dta-cb" onClick={() => fileRef.current?.click()} aria-label="Send a photo">📷</button>
            <textarea ref={taRef} rows={text.length > 120 ? 4 : text.length > 50 ? 2 : 1} value={text} placeholder="Type a message…" maxLength={2000} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) send({ text: text.trim() }); } }} />
            <button className="dta-cb send" disabled={busy || !text.trim()} onClick={() => send({ text: text.trim() })} aria-label="Send">➤</button>
          </div>
        </>
      )}
      {zoom && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="dta-zoom" onClick={() => setZoom("")}><img src={zoom} alt="Photo" /></div>
      )}
      {sheet && (
        <div className="dta-sh" onClick={() => setSheet(false)}>
          <div className="dta-shb" onClick={(e) => e.stopPropagation()}>
            <div className="dta-shh"><b>Ready messages</b><button className="dta-x" onClick={() => setSheet(false)}>✕</button></div>
            <p className="dta-sub" style={{ margin: "0 0 10px" }}>Tap one — it goes in the message box so you can change it before sending.</p>
            <div className="dta-seg" style={{ marginBottom: 6 }}>{([["en", "English"], ["hi", "हिंदी"], ["gu", "ગુજરાતી"]] as const).map(([k, l]) => <button key={k} className={lang === k ? "on" : ""} onClick={() => setLang(k)}>{l}</button>)}</div>
            {Array.from(new Set(TPL.map((t) => t.g))).map((g) => (
              <div key={g}>
                <h4 className="dta-shg">{g}</h4>
                {TPL.filter((t) => t.g === g).map((t, i) => {
                  const msg = fillTpl(t.t[lang], name, me);
                  return <button key={g + i} className="dta-tp" onClick={() => { setText(msg); setSheet(false); setTimeout(() => taRef.current?.focus(), 50); }}>{msg}</button>;
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Client({ id, onBack, onChat, onPlan }: { id: string; onBack: () => void; onChat: () => void; onPlan: (copy: Plan | null) => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState("");
  const post = (b: object) => fetch(`/api/admin/my-clients/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  useEffect(() => {
    fetch(`/api/admin/my-clients/${id}`, { cache: "no-store" }).then((r) => r.json()).then((j: Detail) => { setD(j); setNotes(j.thread.note || ""); }).catch(() => {});
  }, [id]);
  const answers = useMemo(() => d?.profile?.answers || [], [d]);
  if (!d) return <p className="dta-empty" style={{ paddingTop: 120 }}>Loading…</p>;
  const p = d.profile;
  return (
    <div className="dta-sc">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}><button className="dta-back" onClick={onBack}>‹</button><h1 style={{ fontSize: 24, flex: 1 }}>{d.thread.client}</h1><button className="dta-soft" onClick={onChat}>💬 Chat</button></div>
      <p className="dta-sub">Booked {fmtDate(d.thread.date)} · {d.thread.time}</p>
      <div className="dta-card"><h3>Status</h3>
        <div className="dta-seg">{OUT.map(([k, l]) => <button key={k} className={d.thread.outcome === k ? "on" : ""} onClick={() => { setD({ ...d, thread: { ...d.thread, outcome: k } }); post({ action: "outcome", outcome: k }); }}>{l}</button>)}</div>
      </div>
      <div className="dta-card"><h3>From the form</h3>
        {!p ? <p className="dta-sub" style={{ margin: 0 }}>This client hasn&apos;t filled the consultation form yet. Ask your questions in chat.</p> : (
          <div className="dta-kv">
            <span>Goal</span><span>{p.goal || "—"}</span>
            <span>Conditions</span><span>{p.conditions.map(cond).join(", ") || "None"}</span>
            <span>Food</span><span>{p.diet || "—"}</span>
            <span>Allergies</span><span>{p.allergens.join(", ") || "None"}</span>
            {answers.filter(([k]) => !/^(Goal|Diet Type|Conditions|Allergens)$/i.test(k)).map(([k, v]) => [<span key={k + "k"}>{k}</span>, <span key={k + "v"}>{v}</span>])}
          </div>
        )}
      </div>
      <div className="dta-card"><h3>My notes 🔒</h3>
        <textarea className="dta-notes" rows={4} maxLength={2000} value={notes} placeholder="Only you and the Health365 team see these." onChange={(e) => { setNotes(e.target.value); setSaved(""); }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}><button className="dta-soft" onClick={async () => { await post({ action: "note", note: notes }); setSaved("Saved ✓"); }}>Save notes</button><span style={{ color: "var(--g)", fontSize: 13, fontWeight: 600 }}>{saved}</span></div>
      </div>
      <div className="dta-card"><h3>Plans sent</h3>
        {d.plans.length === 0 ? <p className="dta-sub" style={{ margin: 0 }}>No plans sent yet.</p> : d.plans.map((pl) => (
          <div key={pl.id} className="dta-it flat"><span className="dta-t"><b>{pl.title}</b><span>{pl.targetKcal ? `${pl.targetKcal} kcal · ` : ""}{fmtDate(pl.at.slice(0, 10))}{pl.active ? " · current" : ""}</span></span><button className="dta-link" onClick={() => onPlan(pl.plan)}>Copy ›</button></div>
        ))}
      </div>
      <button className="dta-cta" onClick={() => onPlan(null)}>📋 Make a new plan</button>
      <p className="dta-priv">Phone and email stay private with Health365</p>
    </div>
  );
}

function shrink(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const im = new Image();
      im.onerror = reject;
      im.onload = () => {
        const k = Math.min(1, 1280 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      im.src = String(r.result);
    };
    r.readAsDataURL(f);
  });
}

function Style() {
  return <style dangerouslySetInnerHTML={{ __html: `
.dta{--g:#4EAA67;--gs:#E6F3E9;--teal:#287379;--red:#E5394F;--lime:#CBDB3D;--cream:#FFF3E5;--bg:#FFF8F0;--ink:#1F2B2C;--mute:#8A8F98;--line:#F1E3D2;
  max-width:480px;margin:0 auto;min-height:100vh;background:var(--bg);color:var(--ink);font-family:var(--font-inter),Inter,system-ui,sans-serif;font-weight:500;position:relative}
body:has(.dta){background:#EFE7DC}
.dta h1{font-family:var(--font-instrument),Fredoka,sans-serif;font-weight:600;font-size:28px;letter-spacing:-.3px;line-height:1.15}
.dta button:not(.pill){font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
.dta-sc{padding:calc(20px + env(safe-area-inset-top)) 20px 110px}
.dta-sub{color:var(--mute);font-size:14px;margin:2px 0 0}
.dta-empty{color:var(--mute);font-size:14px;text-align:center;padding:18px 0}
.dta-hero{background:var(--teal);color:#fff;border-radius:24px;padding:18px;margin-top:16px}
.dta-hero>b{font-family:var(--font-instrument),Fredoka;font-weight:600;font-size:19px}.dta-hero>p{font-size:13px;opacity:.85;margin-top:3px}
.dta-next{background:rgba(255,255,255,.14);border-radius:16px;padding:12px;margin-top:12px;display:flex;align-items:center;gap:10px}
.dta-next b{font-size:15px;display:block}.dta-next small{font-size:12px;opacity:.85;display:block}
.dta-lime{background:var(--lime)!important;color:var(--ink)!important;border-radius:14px;padding:9px 14px;font-weight:700;font-size:13px;white-space:nowrap}
.dta-av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;flex:none;font-size:16px}
.dta-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.dta-stats div{background:#fff;border-radius:18px;padding:12px}.dta-stats small{font-size:11.5px;color:var(--mute);display:block}.dta-stats b{font-family:var(--font-instrument),Fredoka;font-size:24px;font-weight:600}
.dta-sec{font-family:var(--font-instrument),Fredoka;font-weight:600;font-size:18px;margin:20px 0 8px;display:flex;justify-content:space-between;align-items:center}
.dta-sec button{font-family:var(--font-inter),Inter;font-size:13px;color:var(--teal);font-weight:600}
.dta .dta-it{width:100%;background:#fff;border-radius:18px;padding:12px;display:flex;gap:11px;align-items:center;margin-bottom:8px;text-align:left}
.dta .dta-it.dim{opacity:.6}.dta .dta-it.flat{background:var(--bg);margin:0 0 8px}
.dta-t{flex:1;min-width:0}.dta-t b{font-size:15px;display:block}.dta-t>span{font-size:12.5px;color:var(--mute);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dta-dot{width:10px;height:10px;border-radius:5px;background:var(--red);flex:none}
.dta-tag{font-size:11px;font-weight:700;padding:4px 9px;border-radius:99px;white-space:nowrap}
.dta-tag.late{background:#FDE7EA;color:var(--red)}.dta-tag.o-done{background:var(--gs);color:var(--g)}.dta-tag.o-follow-up{background:#FFF1DE;color:#C27A12}.dta-tag.o-no-show{background:#EEE;color:#777}
.dta-tag.g1{background:var(--cream);color:var(--teal)}.dta-tag.g2{background:#EEEDF8;color:#5d5aa0}.dta-tag.g3{background:var(--gs);color:var(--g)}
.dta-soft{background:var(--cream)!important;color:var(--teal)!important;border-radius:12px;padding:8px 13px;font-weight:700;font-size:13px;white-space:nowrap}
.dta-chev{color:var(--mute);font-size:22px}
.dta-search{width:100%;background:#fff;border:0;border-radius:16px;padding:13px 14px;font-size:14.5px;margin-top:14px;outline:none;font-family:inherit}
.dta-chips{display:flex;gap:8px;margin-top:12px;overflow-x:auto}.dta-chips button{padding:8px 14px;border-radius:99px;font-size:13px;font-weight:600;background:#fff;white-space:nowrap}.dta-chips .on{background:var(--teal);color:#fff}
.dta-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;height:calc(72px + env(safe-area-inset-bottom));padding:0 18px env(safe-area-inset-bottom);background:#fff;border-radius:24px 24px 0 0;display:flex;justify-content:space-between;align-items:center;box-shadow:0 -6px 24px rgba(80,50,20,.06);z-index:20}
.dta-nav button{width:72px;height:54px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:500 11.5px var(--font-instrument),Fredoka,sans-serif;color:#a39c92;position:relative}
.dta-nav button svg{stroke:#a39c92}.dta-nav button.on{background:var(--gs);color:var(--g)}.dta-nav button.on svg{stroke:var(--g)}
.dta-nav .nd{position:absolute;top:7px;right:20px;width:8px;height:8px;border-radius:4px;background:var(--red);border:2px solid #fff}
.dta-card{background:#fff;border-radius:20px;padding:14px;margin-top:12px}.dta-card h3{font-family:var(--font-instrument),Fredoka;font-weight:600;font-size:16px;margin-bottom:8px}
.dta-ul{list-style:disc;padding-left:18px;font-size:13.5px;line-height:1.6;color:#4a5455}
.dta-out{width:100%;margin-top:16px;background:#fff!important;color:var(--red)!important;border-radius:16px;padding:14px;font-weight:700}
.dta-top{position:sticky;top:0;z-index:5;background:var(--bg);display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 16px 10px;border-bottom:1px solid var(--line)}
.dta-top b{font-size:16px;display:block}.dta-top small{font-size:12px;color:var(--mute);display:block}
.dta-back{width:38px;height:38px;border-radius:12px;background:var(--cream)!important;color:var(--teal)!important;font-size:24px;font-weight:700;display:grid;place-items:center;flex:none;line-height:1}
.dta-teal{background:var(--teal)!important;color:#fff!important;border-radius:14px;padding:9px 13px;font-weight:700;font-size:13px;white-space:nowrap}
.dta-chat{display:flex;flex-direction:column;min-height:100vh}
.dta-pills{display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff!important;margin:10px 14px 0;border-radius:16px;padding:10px 12px;text-align:left}
.dta-more{margin-left:auto;color:var(--teal);font-weight:700;font-size:12.5px}
.dta-msgs{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.dta-m{max-width:80%;padding:9px 13px;border-radius:16px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.dta-m.c{background:#fff;align-self:flex-start;border-bottom-left-radius:5px}.dta-m.d{background:var(--teal);color:#fff;align-self:flex-end;border-bottom-right-radius:5px}
.dta-m.ph{padding:4px}.dta-m img{display:block;max-width:220px;max-height:260px;border-radius:12px;cursor:zoom-in}
.dta-m small{display:block;font-size:10.5px;opacity:.6;margin-top:3px}.dta-m.ph small{padding:0 8px 4px}
.dta-m.team{align-self:center;background:var(--cream);font-size:13px;max-width:92%}.dta-m.team b{display:block;font-size:11px}
.dta-qr{display:flex;gap:7px;padding:6px 14px;overflow-x:auto;position:sticky;bottom:70px;background:var(--bg)}
.dta-qr button{background:var(--cream)!important;color:var(--teal)!important;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:99px;white-space:nowrap}
.dta-bar{position:sticky;bottom:0;display:flex;gap:8px;padding:8px 14px calc(12px + env(safe-area-inset-bottom));align-items:flex-end;background:var(--bg)}
.dta-bar textarea{flex:1;resize:none;background:#fff;border:1.5px solid var(--line);border-radius:22px;padding:11px 14px;font:inherit;font-size:15px;max-height:120px;outline:none}
.dta-cb{width:44px;height:44px;border-radius:22px;display:grid;place-items:center;font-size:18px;flex:none;background:#fff!important}.dta-cb.send{background:var(--teal)!important;color:#fff!important}.dta-cb:disabled{opacity:.5}
.dta-note{font-size:12.5px;color:#C0533A;padding:0 16px}.dta-closed{text-align:center;font-size:13.5px;color:var(--mute);padding:16px 20px 24px}
.dta-zoom{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:50;display:grid;place-items:center;padding:12px}.dta-zoom img{max-width:100%;max-height:100%;border-radius:8px}
.dta-seg{display:flex;gap:6px}.dta-seg button{flex:1;padding:9px 0;border-radius:12px;font-size:12.5px;font-weight:700;background:var(--bg)}.dta-seg .on{background:var(--g);color:#fff}
.dta-kv{display:grid;grid-template-columns:minmax(100px,38%) 1fr;gap:7px 12px;font-size:13.5px}.dta-kv span:nth-child(odd){color:var(--mute)}.dta-kv span{overflow-wrap:anywhere}
.dta-notes{width:100%;border:1.5px solid var(--line);border-radius:14px;padding:10px 12px;font:inherit;font-size:14px;resize:vertical;outline:none;background:var(--bg)}
.dta-link{color:var(--teal);font-weight:700;font-size:13px;white-space:nowrap}
.dta-cta{width:100%;background:var(--teal)!important;color:#fff!important;border-radius:16px;padding:15px;font-weight:700;margin-top:14px;font-size:15px}
.dta-priv{font-size:11.5px;color:var(--mute);text-align:center;margin-top:8px}
.dta-pb{padding:14px 14px 40px}
.dta .dta-seg button{background:var(--bg)}.dta .dta-seg button.on{background:var(--g);color:#fff}
.dta .dta-sh .dta-seg button{background:#fff}.dta .dta-sh .dta-seg button.on{background:var(--g);color:#fff}
.dta-qr .tp{background:var(--teal)!important;color:#fff!important}
.dta-tag.new{background:var(--lime);color:var(--ink)}
.dta-terms{padding:calc(24px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto}
.dta-tbox{background:#fff;border-radius:20px;padding:16px;margin-top:16px;max-height:52vh;overflow-y:auto;border:1px solid var(--line)}
.dta-tok{display:flex;gap:10px;align-items:flex-start;margin-top:16px;font-size:14px;font-weight:600;line-height:1.45}
.dta-tok input{width:20px;height:20px;margin-top:1px;accent-color:var(--teal);flex:none}
.dta-terr{color:var(--red);font-size:13px;margin-top:8px}
.dta button.dta-ok:disabled{opacity:.45}
.dta button.dta-tout{display:block;margin:12px auto 0;color:var(--mute);font-size:14px;font-weight:600}
.dta-sh.dta-pop{align-items:center;padding:16px}.dta-pop .dta-shb{border-radius:24px;max-width:420px}
.dta-nb{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px}
.dta-nb b{display:block;font-size:15px}.dta-nb small{display:block;font-size:12px;color:var(--mute)}
.dta button.dta-ok{display:block;width:100%;margin-top:6px;background:var(--teal);color:#fff;border-radius:14px;padding:13px;font-weight:700;font-size:15px}
.dta-sh{position:fixed;inset:0;background:rgba(31,43,44,.45);z-index:60;display:flex;align-items:flex-end;justify-content:center}
.dta-shb{background:var(--bg);width:100%;max-width:480px;max-height:82vh;overflow-y:auto;border-radius:24px 24px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom))}
.dta-shh{display:flex;justify-content:space-between;align-items:center}.dta-shh b{font-family:var(--font-instrument),Fredoka;font-size:19px;font-weight:600}
.dta-x{width:34px;height:34px;border-radius:12px;background:var(--cream)!important;color:var(--teal)!important;font-weight:700}
.dta-shg{font-size:12px;font-weight:700;color:var(--mute);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px}
.dta button.dta-tp{display:block;width:100%;text-align:left;background:#fff;border-radius:16px;padding:11px 13px;font-size:13.5px;line-height:1.45;margin-bottom:7px}
` }} />;
}

// First open after joining (or after the terms change): the dietitian must
// accept the terms before they can see clients.
function TermsGate({ onDone }: { onDone: () => void }) {
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const accept = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/admin/my-clients/terms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accept: true }) }).catch(() => null);
    setBusy(false);
    if (!r || !r.ok) { setErr("Couldn't save. Check your internet and try again."); return; }
    onDone();
  };
  return (
    <div className="dta-terms">
      <p className="dta-sub">Welcome to Health365 👋</p>
      <h1>Before you start</h1>
      <p className="dta-sub" style={{ marginTop: 6 }}>Please read and accept the terms for dietitians. You need to do this once.</p>
      <div className="dta-tbox"><DietitianTermsText compact /></div>
      <label className="dta-tok"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /><span>I have read and agree to the Terms for dietitians.</span></label>
      {err && <p className="dta-terr">{err}</p>}
      <button className="dta-ok" disabled={!ok || busy} onClick={accept}>{busy ? "Saving…" : "I agree, continue"}</button>
      <button className="dta-tout" onClick={async () => { await fetch("/api/auth/admin-logout", { method: "POST" }); location.href = "/admin/login"; }}>Log out</button>
    </div>
  );
}
