"use client";

import { useState } from "react";

interface SiteContent {
  asthaName: string;
  asthaRole: string;
  asthaQuote: string;
  asthaBio: string;
  asthaQualifications: string;
  asthaPhotoUrl: string;
  heroStatNumber: string;
  heroStatLabel: string;
}

export default function ContentEditorForm({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
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
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>Dr. Astha's profile</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label>Name</label>
            <input value={content.asthaName} onChange={(e) => update("asthaName", e.target.value)} />
          </div>
          <div className="field">
            <label>Role / title</label>
            <input value={content.asthaRole} onChange={(e) => update("asthaRole", e.target.value)} />
          </div>
          <div className="field">
            <label>Quote <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— the big pull-quote on the homepage</span></label>
            <textarea rows={3} value={content.asthaQuote} onChange={(e) => update("asthaQuote", e.target.value)} />
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea rows={3} value={content.asthaBio} onChange={(e) => update("asthaBio", e.target.value)} />
          </div>
          <div className="field">
            <label>Qualifications &amp; credentials</label>
            <textarea rows={2} value={content.asthaQualifications} onChange={(e) => update("asthaQualifications", e.target.value)} />
          </div>
          <div className="field">
            <label>Photo URL <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— a link to a hosted photo (optional, leave blank to keep the current placeholder)</span></label>
            <input value={content.asthaPhotoUrl} onChange={(e) => update("asthaPhotoUrl", e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>Hero stat card</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label>Number <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— e.g. "10K+"</span></label>
            <input value={content.heroStatNumber} onChange={(e) => update("heroStatNumber", e.target.value)} />
          </div>
          <div className="field">
            <label>Label</label>
            <input value={content.heroStatLabel} onChange={(e) => update("heroStatLabel", e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="submit" disabled={saving} className="pill pill-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".88rem", fontWeight: 600 }}>✓ Saved — live on the site now</span>}
      </div>
    </form>
  );
}
