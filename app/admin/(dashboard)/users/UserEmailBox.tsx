"use client";

import { useState } from "react";
import { USER_MESSAGES, fillUserMessage } from "@/lib/userMessages";

// Email one user (from their page) or everyone in the current list.
export default function UserEmailBox({ ids, name, label }: { ids: string[]; name?: string; label?: string }) {
  const [k, setK] = useState("welcome");
  const first = USER_MESSAGES[0];
  const [subject, setSubject] = useState(first.subject);
  const [body, setBody] = useState(first.body);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");

  const pick = (key: string) => {
    const m = USER_MESSAGES.find((x) => x.key === key)!;
    setK(key); setSubject(m.subject); setBody(m.body); setDone(""); setErr("");
  };
  const send = async () => {
    if (ids.length > 1 && !confirm(`Send this email to ${ids.length} people?`)) return;
    setBusy(true); setDone(""); setErr("");
    const r = await fetch("/api/admin/users/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, subject, body }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setErr(j.error || "Couldn't send. Try again."); return; }
    setDone(`Sent ✅ ${j.sent} of ${ids.length}${j.skipped ? ` · ${j.skipped} had no email` : ""}${j.failed ? ` · ${j.failed} failed` : ""}`);
    if (j.firstError) setErr(`Email didn't go — ${j.firstError}`);
  };
  const who = name ? name.split(" ")[0] : "Asha";

  return (
    <div className="ue">
      <p className="ue-h">✉️ {label || (ids.length === 1 ? `Email ${name || "this user"}` : `Email ${ids.length} people`)}</p>
      <div className="ue-chips">
        {USER_MESSAGES.map((m) => <button key={m.key} type="button" className={k === m.key ? "on" : ""} onClick={() => pick(m.key)}>{m.label}</button>)}
      </div>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={150} aria-label="Subject" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={3000} aria-label="Message" />
      <p className="ue-tip">{"{name}"} becomes their first name ({fillUserMessage("{name}", who)}). Replies go to health365.support@gmail.com.</p>
      <div className="ue-row">
        <button type="button" className="pill pill-primary" disabled={busy || !ids.length || !subject.trim() || !body.trim()} onClick={send}>{busy ? `Sending${ids.length > 1 ? " (takes a few seconds)" : ""}…` : "Send email"}</button>
      </div>
      {done && <p className="ue-done">{done}</p>}
      {err && <p className="ue-err">{err}</p>}
      <style dangerouslySetInnerHTML={{ __html: `
.ue{display:flex;flex-direction:column;gap:10px}
.ue-h{font-weight:700;font-size:1rem}
.ue-chips{display:flex;flex-wrap:wrap;gap:8px}
.ue-chips button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 14px;font-size:.8rem;font-weight:600;cursor:pointer}
.ue-chips button.on{background:#287379;color:#fff;border-color:#287379}
.ue input,.ue textarea{border:1px solid var(--line);border-radius:12px;padding:10px 14px;font:inherit;font-size:.9rem;background:#fff;width:100%;box-sizing:border-box}
.ue-tip{font-size:.75rem;color:var(--ink-soft)}
.ue-row{display:flex;justify-content:flex-end}
.ue-done{font-size:.82rem;font-weight:600;color:#287379;text-align:right}
.ue-err{font-size:.8rem;font-weight:600;color:#B4442A;text-align:right;line-height:1.45}
` }} />
    </div>
  );
}
