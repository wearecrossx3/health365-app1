"use client";

import { useState } from "react";

interface Settings {
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  linkedinUrl: string;
  premiumOriginalPrice: string;
  premiumDiscountedPrice: string;
  premiumUpiId: string;
}

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [values, setValues] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save — please try again.");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="panel" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="field">
        <label>Site title</label>
        <input value={values.siteTitle} onChange={(e) => update("siteTitle", e.target.value)} />
      </div>
      <div className="field">
        <label>Contact email <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— for your own records only, not shown on the site</span></label>
        <input type="email" value={values.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="hello@health365.in" />
      </div>
      <div className="field">
        <label>Contact phone <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— for your own records only, not shown on the site</span></label>
        <input value={values.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="+91 98765 43210" />
      </div>
      <div className="field">
        <label>WhatsApp number <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— for your own records only, not shown on the site</span></label>
        <input value={values.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} placeholder="+91 98765 43210" />
      </div>

      <div style={{ borderTop: "1px solid var(--line)", margin: "6px 0" }} />
      <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: "-6px 0 2px" }}>
        These show as icons in the site footer — leave any blank to hide that icon.
      </p>
      <div className="field">
        <label>Instagram URL</label>
        <input value={values.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://instagram.com/health365" />
      </div>
      <div className="field">
        <label>YouTube URL</label>
        <input value={values.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} placeholder="https://youtube.com/@health365" />
      </div>
      <div className="field">
        <label>Pinterest URL</label>
        <input value={values.pinterestUrl} onChange={(e) => update("pinterestUrl", e.target.value)} placeholder="https://pinterest.com/health365" />
      </div>
      <div className="field">
        <label>LinkedIn URL</label>
        <input value={values.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/company/health365" />
      </div>

      <div style={{ borderTop: "1px solid var(--line)", margin: "6px 0" }} />
      <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: "-6px 0 2px" }}>
        Shown in the &quot;Consult a Dietitian&quot; popup after someone generates a free diet plan. There&apos;s
        no card payment gateway connected — this is a manual UPI flow: the visitor sees this price, pays you
        directly via UPI, then confirms, and it lands as a message for you to follow up on.
      </p>
      <div className="admin-grid-2" style={{ gap: 16 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Regular price (₹) <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— shown struck through</span></label>
          <input value={values.premiumOriginalPrice} onChange={(e) => update("premiumOriginalPrice", e.target.value)} placeholder="2500" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Discounted price (₹) <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— what they actually pay</span></label>
          <input value={values.premiumDiscountedPrice} onChange={(e) => update("premiumDiscountedPrice", e.target.value)} placeholder="1500" />
        </div>
      </div>
      <div className="field">
        <label>Your UPI ID</label>
        <input value={values.premiumUpiId} onChange={(e) => update("premiumUpiId", e.target.value)} placeholder="health365@upi" />
      </div>

      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="submit" disabled={saving} className="pill pill-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".88rem", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </form>
  );
}
