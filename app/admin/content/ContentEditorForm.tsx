"use client";

import { useState } from "react";
import ImageUploadField from "./ImageUploadField";

interface SiteContent {
  asthaName: string;
  asthaRole: string;
  asthaQuote: string;
  asthaBio: string;
  asthaQualifications: string;
  asthaPhotoUrl: string;
  heroStatNumber: string;
  heroStatLabel: string;
  heroImageUrl: string;
  goalLabels: string[];
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

  function updateGoalLabel(index: number, value: string) {
    const next = [...content.goalLabels];
    next[index] = value;
    update("goalLabels", next);
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
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>Hero image</h2>
        <ImageUploadField
          label="Hero background photo"
          hint="leave blank to keep the current color placeholder"
          value={content.heroImageUrl}
          onChange={(url) => update("heroImageUrl", url)}
        />
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

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Goal cards</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The 4 "What brings you here?" cards on the homepage.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {content.goalLabels.map((label, i) => (
            <div className="field" key={i} style={{ marginBottom: 0 }}>
              <label>Card {i + 1}</label>
              <input value={label} onChange={(e) => updateGoalLabel(i, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

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
          <ImageUploadField
            label="Photo"
            hint="optional, leave blank to keep the current placeholder"
            value={content.asthaPhotoUrl}
            onChange={(url) => update("asthaPhotoUrl", url)}
          />
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
