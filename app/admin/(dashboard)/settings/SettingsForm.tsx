"use client";

import { useState } from "react";

interface Settings {
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
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
        <label>Contact email</label>
        <input type="email" value={values.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="hello@health365.in" />
      </div>
      <div className="field">
        <label>Contact phone</label>
        <input value={values.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="+91 98765 43210" />
      </div>
      <div className="field">
        <label>WhatsApp number</label>
        <input value={values.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} placeholder="+91 98765 43210" />
      </div>
      <div className="field">
        <label>Instagram URL</label>
        <input value={values.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://instagram.com/health365" />
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
