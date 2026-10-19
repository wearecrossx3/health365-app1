"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMsg { id: string; from: "client" | "dietitian" | "team"; text: string; img?: string; at: number; flagged?: boolean; orig?: string }

// One chat thread, used by the client (website), the dietitian portal and the
// owner view. `me` decides which bubbles sit on the right.
export default function ConsultChatPanel({
  threadId, loadUrl, send, me, canSend, closedText, names, showOriginals,
}: {
  threadId: string;
  loadUrl: string;
  send: (body: { text: string; image?: string }) => Promise<{ ok: boolean; error?: string; masked?: boolean }>;
  me: "client" | "dietitian" | "team";
  canSend: boolean;
  closedText?: string;
  names: { client: string; dietitian: string };
  showOriginals?: boolean;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; t: string } | null>(null);
  const [zoom, setZoom] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const count = useRef(0);

  async function load() {
    const r = await fetch(loadUrl, { cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) return;
    const d = await r.json();
    setMsgs(d.messages || []);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUrl]);
  useEffect(() => {
    if (msgs.length !== count.current) { count.current = msgs.length; endRef.current?.scrollIntoView({ block: "end" }); }
  }, [msgs]);

  async function submit(image?: string) {
    if (!image && !text.trim()) return;
    setBusy(true); setNote(null);
    const r = await send({ text: image ? "" : text.trim(), image });
    setBusy(false);
    if (!r.ok) { setNote({ ok: false, t: r.error || "Couldn't send." }); return; }
    if (!image) setText("");
    if (r.masked) setNote({ ok: false, t: "Phone numbers, emails and links are hidden in chat — please keep the conversation inside Health365." });
    load();
  }
  async function pick(f: File | undefined) {
    if (!f) return;
    const url = await shrink(f).catch(() => "");
    if (!url) { setNote({ ok: false, t: "Couldn't read that photo." }); return; }
    submit(url);
  }

  const who = (m: ChatMsg) => (m.from === "team" ? "Health365 team" : m.from === "client" ? names.client : names.dietitian);
  const img = (id: string) => `/api/consult-chat/img/${threadId}/${id}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1.5px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div style={{ height: 420, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "var(--paper)" }}>
        {msgs.length === 0 && <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: ".88rem", margin: "auto 0" }}>No messages yet. Say hello 👋</p>}
        {msgs.map((m) => {
          const mine = m.from === me;
          const team = m.from === "team";
          return (
            <div key={m.id} style={{ alignSelf: team ? "center" : mine ? "flex-end" : "flex-start", maxWidth: team ? "90%" : "78%" }}>
              {!mine && !team && <p style={{ fontSize: ".7rem", color: "var(--ink-soft)", margin: "0 0 2px 4px" }}>{who(m)}</p>}
              <div style={{ background: team ? "#FFF3E5" : mine ? "#287379" : "#fff", color: mine && !team ? "#fff" : "var(--ink)", border: mine || team ? "none" : "1px solid var(--line)", borderRadius: 14, padding: m.img ? 4 : "8px 12px", fontSize: ".9rem", lineHeight: 1.45, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {team && <b style={{ fontSize: ".72rem", display: "block" }}>Health365 team</b>}
                {m.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(m.img)} alt="Photo" onClick={() => setZoom(img(m.img!))} style={{ display: "block", maxWidth: 220, maxHeight: 260, borderRadius: 11, cursor: "zoom-in" }} />
                )}
                {m.text}
              </div>
              <p style={{ fontSize: ".66rem", color: "var(--ink-soft)", textAlign: mine ? "right" : "left", margin: "2px 4px 0" }}>
                {new Date(m.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                {m.flagged && " · contact details hidden"}
              </p>
              {showOriginals && m.orig && <p style={{ fontSize: ".72rem", color: "var(--terracotta)", margin: "2px 4px 0" }}>⚠️ Original: {m.orig}</p>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {canSend ? (
        <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid var(--line)", alignItems: "flex-end" }}>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="pill pill-outline" style={{ padding: "8px 12px" }} aria-label="Send a photo">📷</button>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="Type a message…" maxLength={2000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            style={{ flex: 1, resize: "none", border: "1.5px solid var(--line)", borderRadius: 12, padding: "9px 12px", fontSize: ".92rem", fontFamily: "inherit", minHeight: 40, maxHeight: 120 }} />
          <button type="button" onClick={() => submit()} disabled={busy || !text.trim()} className="pill pill-primary" style={{ padding: "8px 16px" }}>{busy ? "…" : "Send"}</button>
        </div>
      ) : (
        <p style={{ padding: 12, fontSize: ".85rem", color: "var(--ink-soft)", borderTop: "1px solid var(--line)", textAlign: "center" }}>{closedText || "This chat is closed."}</p>
      )}
      {note && <p style={{ padding: "0 12px 10px", fontSize: ".8rem", color: note.ok ? "#2E7D4F" : "var(--terracotta)" }}>{note.t}</p>}
      {zoom && (
        <div onClick={() => setZoom("")} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "grid", placeItems: "center", padding: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Photo" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

// Photos are resized on the device (max 1280px JPEG) before sending.
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
