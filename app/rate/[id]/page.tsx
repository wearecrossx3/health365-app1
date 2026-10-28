"use client";

import { useEffect, useState } from "react";

// Rate a consultation — opened from the link the Health365 team posts in chat.
export default function RatePage({ params, searchParams }: { params: { id: string }; searchParams: { t?: string } }) {
  const t = searchParams.t || "";
  const [info, setInfo] = useState<{ dietitian: string; client: string; date: string; rating: { stars: number; comment: string } | null } | null>(null);
  const [err, setErr] = useState("");
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/rate?id=${encodeURIComponent(params.id)}&t=${encodeURIComponent(t)}`).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || "This link isn't valid."); return; }
      setInfo(j);
      if (j.rating) { setStars(j.rating.stars); setComment(j.rating.comment || ""); }
    }).catch(() => setErr("Couldn't load. Check your internet."));
  }, [params.id, t]);

  async function send() {
    setBusy(true); setErr("");
    const r = await fetch("/api/rate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: params.id, t, stars, comment }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setErr(j.error || "Couldn't save. Try again."); return; }
    setDone(true);
  }

  const labels = ["", "Not good", "Okay", "Good", "Very good", "Excellent"];
  return (
    <main style={{ minHeight: "80vh", background: "var(--paper, #FFF8F0)", padding: "48px 18px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 22, padding: "28px 24px", boxShadow: "0 10px 30px rgba(0,0,0,.06)", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/email-logo.png" alt="Health365" style={{ width: 150, height: "auto", margin: "0 auto 16px", display: "block" }} />
        {!info && !err && <p>Loading…</p>}
        {err && <p style={{ color: "#B4442A", fontWeight: 600 }}>{err}</p>}
        {info && !done && (
          <>
            <h1 style={{ fontSize: "1.35rem", margin: "0 0 6px" }}>How was your consultation?</h1>
            <p style={{ color: "#6B7672", margin: "0 0 18px" }}>Hi {info.client}, please rate your session with <b>{info.dietitian}</b>.</p>
            <div role="radiogroup" aria-label="Rating" style={{ display: "flex", justifyContent: "center", gap: 6 }} onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setStars(n)}
                  style={{ fontSize: 40, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: (hover || stars) >= n ? "#F6A31D" : "#D9D4CB", padding: 4, minWidth: 44, minHeight: 44 }}>★</button>
              ))}
            </div>
            <p style={{ height: 20, fontWeight: 600, color: "#287379", margin: "6px 0 14px" }}>{labels[hover || stars]}</p>
            <label htmlFor="rc" style={{ display: "block", textAlign: "left", fontSize: ".85rem", fontWeight: 600, marginBottom: 6 }}>Anything to share? <span style={{ fontWeight: 400, color: "#6B7672" }}>(optional)</span></label>
            <textarea id="rc" rows={3} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like? What could be better?" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E4E0D8", borderRadius: 12, padding: "10px 12px", font: "inherit" }} />
            <button type="button" disabled={!stars || busy} onClick={send} style={{ marginTop: 16, width: "100%", minHeight: 48, border: "none", borderRadius: 999, background: stars ? "#287379" : "#B9C9C7", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: stars ? "pointer" : "default" }}>{busy ? "Saving…" : info.rating ? "Update my rating" : "Send rating"}</button>
          </>
        )}
        {done && (
          <>
            <p style={{ fontSize: 44, margin: 0 }}>🙏</p>
            <h1 style={{ fontSize: "1.3rem" }}>Thank you!</h1>
            <p style={{ color: "#6B7672" }}>Your rating helps other people find the right dietitian.</p>
            <a href="/app" style={{ display: "inline-block", marginTop: 10, color: "#287379", fontWeight: 700 }}>Open the Health365 app ›</a>
          </>
        )}
      </div>
    </main>
  );
}
