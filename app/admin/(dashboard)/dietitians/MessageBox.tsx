"use client";

import { useState } from "react";
import { DT_MESSAGES, fillDtMessage } from "@/lib/dietitianMessages";

// Pick a ready message, change it if needed, then send it in the Dietitian app
// (pop-up + phone notification) and/or by email, or open it in WhatsApp.
export default function MessageBox({ ids, name, phone, onClose }: { ids: string[]; name?: string; phone?: string; onClose?: () => void }) {
  const [k, setK] = useState(DT_MESSAGES[0].key);
  const first = DT_MESSAGES[0];
  const [title, setTitle] = useState(first.title);
  const [body, setBody] = useState(first.body);
  const [app, setApp] = useState(true);
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [mailErr, setMailErr] = useState("");
  const many = ids.length > 1;
  const preview = (s: string) => (name ? fillDtMessage(s, name) : s);

  const pick = (key: string) => {
    const m = DT_MESSAGES.find((x) => x.key === key)!;
    setK(key); setTitle(m.title); setBody(m.body); setDone("");
  };
  const send = async () => {
    setBusy(true); setDone(""); setMailErr("");
    const r = await fetch("/api/admin/dietitians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "message", ids, title, body, app, email }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setDone(j.error || "Couldn't send. Try again."); return; }
    const parts = [app && `in the app to ${j.sent}`, email && `email to ${j.emailed} of ${j.sent}`].filter(Boolean).join(", ");
    setDone(`Sent ✅ ${parts}`);
    if (email && j.emailError) setMailErr(`Email didn't go — ${j.emailError}${ph ? " Use WhatsApp for now." : ""}`);
  };
  const ph = (phone || "").replace(/\D/g, "").slice(-10);
  const wa = ph ? `https://wa.me/91${ph}?text=${encodeURIComponent(preview(title) + "\n\n" + preview(body))}` : "";

  return (
    <div className="mb">
      <div className="mb-chips">
        {DT_MESSAGES.map((m) => <button key={m.key} className={k === m.key ? "on" : ""} onClick={() => pick(m.key)}>{m.label}</button>)}
      </div>
      <input className="mb-in" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" maxLength={120} />
      <textarea className="mb-in" rows={5} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" maxLength={1500} />
      <p className="mb-hint">{"{name}"} becomes {many ? "each dietitian's" : "their"} first name{name ? ` (${name.split(" ")[0]})` : ""}.</p>
      <div className="mb-opts">
        <label><input type="checkbox" checked={app} onChange={(e) => setApp(e.target.checked)} /> In the Dietitian app</label>
        <label><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email</label>
      </div>
      <div className="mb-btns">
        {onClose && <button className="pill pill-outline" onClick={onClose} style={{ padding: "8px 16px", fontSize: ".8rem" }}>Close</button>}
        {wa && <a className="pill pill-outline" href={wa} target="_blank" rel="noopener" style={{ padding: "8px 16px", fontSize: ".8rem" }}>Open in WhatsApp</a>}
        <button className="pill pill-primary" disabled={busy || (!app && !email)} onClick={send} style={{ padding: "8px 16px", fontSize: ".8rem" }}>
          {busy ? "Sending…" : many ? `Send to ${ids.length}` : "Send"}
        </button>
      </div>
      {done && <p className="mb-done">{done}</p>}
      {mailErr && <p className="mb-err">{mailErr}</p>}
    </div>
  );
}

export const MB_CSS = `
.mb{background:var(--paper);border-radius:14px;padding:12px}
.mb-chips{display:flex;gap:6px;flex-wrap:wrap}
.mb-chips button{font-size:.76rem;font-weight:600;padding:6px 11px;border-radius:99px;border:1px solid var(--line);background:#fff;cursor:pointer}
.mb-chips button.on{background:var(--teal);border-color:var(--teal);color:#fff}
.mb-in{display:block;width:100%;margin-top:8px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:#fff;font:inherit;font-size:.9rem;box-sizing:border-box;resize:vertical}
.mb-hint{font-size:.74rem;color:var(--ink-soft);margin-top:6px}
.mb-opts{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;font-size:.85rem}
.mb-opts label{display:flex;gap:6px;align-items:center;cursor:pointer}
.mb-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:10px}
.mb-err{font-size:.8rem;font-weight:600;color:#B4442A;margin-top:6px;text-align:right;line-height:1.45}
.mb-done{font-size:.82rem;font-weight:600;color:var(--teal-deep);margin-top:8px;text-align:right}
`;
