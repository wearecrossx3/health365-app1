"use client";

import { useState } from "react";
import ImageUploadField from "../content/ImageUploadField";
import type { AppOffer } from "@/lib/offers";

const PALETTE = ["#287379", "#4EAA67", "#E5394F", "#F6961D", "#9997C9", "#CBDB3D"];
const small = { fontWeight: 400, color: "var(--ink-soft)" } as const;
const BLANK: Partial<AppOffer> = {
  title: "", text: "", imageUrl: "", badge: "", ctaText: "Book now", action: "consult", blogSlug: "", couponCode: "",
  color: "#287379", startsOn: "", endsOn: "", frequency: "once", audience: "all", enabled: true,
};

function Preview({ o }: { o: Partial<AppOffer> }) {
  const light = o.color === "#CBDB3D";
  return (
    <div style={{ width: 280, borderRadius: 26, overflow: "hidden", background: "#fff", boxShadow: "0 20px 50px rgba(31,43,44,.18)", fontFamily: "inherit" }}>
      <div style={{ background: o.color, color: light ? "#1F2B2C" : "#fff", padding: "22px 20px 18px", position: "relative", minHeight: 120 }}>
        {o.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
        )}
        {o.badge && <span style={{ position: "relative", display: "inline-block", background: "rgba(255,255,255,.92)", color: "#1F2B2C", fontWeight: 800, fontSize: ".72rem", padding: "4px 10px", borderRadius: 999 }}>{o.badge}</span>}
        <p style={{ position: "relative", fontSize: "1.25rem", fontWeight: 700, marginTop: 10, lineHeight: 1.2 }}>{o.title || "Offer title"}</p>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <p style={{ fontSize: ".86rem", color: "#4A5556", lineHeight: 1.5 }}>{o.text || "A short line about the offer."}</p>
        {o.couponCode && <p style={{ marginTop: 12, border: "1.5px dashed #287379", borderRadius: 12, padding: "8px 12px", fontWeight: 800, letterSpacing: ".08em", color: "#287379", textAlign: "center" }}>{o.couponCode}</p>}
        <div style={{ marginTop: 14, background: "#1F2B2C", color: "#fff", textAlign: "center", borderRadius: 999, padding: "11px", fontWeight: 700, fontSize: ".9rem" }}>{o.ctaText || "Book now"}</div>
        <p style={{ textAlign: "center", fontSize: ".75rem", color: "#8A8F98", marginTop: 10 }}>Not now</p>
      </div>
    </div>
  );
}

export default function OffersManager({ initial }: { initial: AppOffer[] }) {
  const [list, setList] = useState(initial);
  const [form, setForm] = useState<Partial<AppOffer> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<AppOffer>) => setForm((f) => ({ ...(f || {}), ...p }));

  async function save() {
    if (!form) return;
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(d.error || "Couldn't save.");
    setList((l) => (form.id ? l.map((x) => (x.id === d.offer.id ? d.offer : x)) : [d.offer, ...l]));
    setForm(null);
  }
  async function toggle(o: AppOffer) {
    const next = { ...o, enabled: !o.enabled };
    setList((l) => l.map((x) => (x.id === o.id ? next : x)));
    await fetch("/api/admin/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
  }
  async function remove(o: AppOffer) {
    if (!confirm(`Delete "${o.title}"?`)) return;
    setList((l) => l.filter((x) => x.id !== o.id));
    await fetch("/api/admin/offers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id }) });
  }
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const status = (o: AppOffer): [string, string] => {
    if (!o.enabled) return ["Off", "#8A8F98"];
    if (o.startsOn && today < o.startsOn) return [`Starts ${o.startsOn}`, "#B4690E"];
    if (o.endsOn && today > o.endsOn) return ["Ended", "#A51F31"];
    return ["Live in app", "#2E7D4F"];
  };

  if (form) {
    return (
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div className="panel" style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: "1.05rem" }}>{form.id ? "Edit offer" : "New offer"}</h2>
          <div className="field" style={{ marginBottom: 0 }}><label>Title</label><input value={form.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="Diwali special: 40% off consultations" /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Text</label><textarea rows={2} maxLength={240} value={form.text} onChange={(e) => set({ text: e.target.value })} placeholder="Talk 1:1 with our dietitian and get your personal 7-day plan." /></div>
          <div className="admin-grid-2" style={{ gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}><label>Badge <span style={small}>— optional</span></label><input value={form.badge} maxLength={24} onChange={(e) => set({ badge: e.target.value })} placeholder="40% OFF" /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Coupon code <span style={small}>— optional</span></label><input value={form.couponCode} maxLength={24} onChange={(e) => set({ couponCode: e.target.value.toUpperCase() })} placeholder="DIWALI40" /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Button text</label><input value={form.ctaText} maxLength={32} onChange={(e) => set({ ctaText: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Button opens</label>
              <select value={form.action} onChange={(e) => set({ action: e.target.value as AppOffer["action"] })}>
                <option value="consult">Book a consultation</option>
                <option value="plan">Make a diet plan</option>
                <option value="calories">Calorie counter</option>
                <option value="blog">A blog post</option>
                <option value="none">Just close</option>
              </select>
            </div>
          </div>
          {form.action === "blog" && <div className="field" style={{ marginBottom: 0 }}><label>Blog post link (slug)</label><input value={form.blogSlug} onChange={(e) => set({ blogSlug: e.target.value })} placeholder="start-lunch-with-salad" /></div>}
          <div className="admin-grid-2" style={{ gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}><label>Starts <span style={small}>— empty = now</span></label><input type="date" value={form.startsOn} onChange={(e) => set({ startsOn: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Ends <span style={small}>— empty = no end</span></label><input type="date" value={form.endsOn} onChange={(e) => set({ endsOn: e.target.value })} /></div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>How often</label>
              <select value={form.frequency} onChange={(e) => set({ frequency: e.target.value as AppOffer["frequency"] })}>
                <option value="once">Once per person</option>
                <option value="daily">Once a day</option>
                <option value="every_open">Every time the app opens</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Who sees it</label>
              <select value={form.audience} onChange={(e) => set({ audience: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="account">People with an account</option>
                <option value="guest">People without an account</option>
                <option value="free">People who used their free 7-day plan</option>
                <option value="diabetes">Diabetes plans</option>
                <option value="pcos">PCOS plans</option>
                <option value="thyroid">Thyroid plans</option>
                <option value="weight">Weight plans</option>
              </select>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Colour</p>
            <div style={{ display: "flex", gap: 8 }}>{PALETTE.map((c) => <button type="button" key={c} onClick={() => set({ color: c })} style={{ width: 32, height: 32, borderRadius: 999, background: c, border: form.color === c ? "3px solid #1F2B2C" : "2px solid #fff", boxShadow: "0 0 0 1px var(--line)", cursor: "pointer" }} />)}</div>
          </div>
          <ImageUploadField label="Image" hint="optional — sits behind the title" value={form.imageUrl || ""} onChange={(u) => set({ imageUrl: u })} />
          {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pill pill-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save offer"}</button>
            <button className="pill" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
        <div style={{ position: "sticky", top: 24 }}>
          <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>PREVIEW IN APP</p>
          <Preview o={form} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><button className="pill pill-primary" onClick={() => setForm({ ...BLANK })}>+ New offer</button></div>
      {list.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No offers yet.</p>}
      {list.map((o) => {
        const [st, col] = status(o);
        return (
          <div key={o.id} className="panel" style={{ display: "flex", gap: 16, alignItems: "center", padding: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: o.color, flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700 }}>{o.title} <span style={{ fontSize: ".74rem", color: col, marginLeft: 6 }}>● {st}</span></p>
              <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 2 }}>
                {o.frequency === "once" ? "Once per person" : o.frequency === "daily" ? "Once a day" : "Every open"} · {o.audience}{o.couponCode ? ` · ${o.couponCode}` : ""}{o.endsOn ? ` · till ${o.endsOn}` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "none" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: ".78rem", fontWeight: 600 }}><input type="checkbox" checked={o.enabled} onChange={() => toggle(o)} />{o.enabled ? "On" : "Off"}</label>
              <button onClick={() => setForm(o)} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>Edit</button>
              <button onClick={() => remove(o)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, fontSize: ".8rem", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
