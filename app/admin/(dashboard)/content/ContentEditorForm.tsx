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
  logoUrlLight: string;
  logoUrlDark: string;
  finalCtaImageUrl: string;
  approachImageUrl: string;
  processImages: string[];
  conditionImages: string[];
  goalImages: string[];
  popupEnabled: boolean;
  popupMessage: string;
  popupCtaText: string;
  popupCtaLink: string;
  popupTrigger: "scroll" | "time";
  popupTriggerValue: number;
}

const PROCESS_LABELS = ["Tell us about you", "Understand your needs", "Build your plan", "Keep moving"];
const CONDITION_LABELS = ["Diabetes", "PCOS", "Thyroid", "Weight Management", "Cholesterol", "Digestive Health"];

export default function ContentEditorForm({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  function updateArrayItem(key: "goalLabels" | "processImages" | "conditionImages" | "goalImages", index: number, value: string) {
    const next = [...content[key]];
    next[index] = value;
    update(key, next);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--paper)", paddingBottom: 12, marginBottom: -8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 18px" }}>
          <button type="submit" disabled={saving} className="pill pill-primary">
            {saving ? "Saving…" : "Save all changes"}
          </button>
          {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".88rem", fontWeight: 600 }}>✓ Saved — live on the site now</span>}
          {error && <span style={{ color: "var(--terracotta)", fontSize: ".88rem" }}>{error}</span>}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Site logo</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Two versions, for two backgrounds — the site automatically switches between them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <ImageUploadField
            label="Light / white logo"
            hint="used over the dark hero photo, top of the homepage"
            value={content.logoUrlLight}
            onChange={(url) => update("logoUrlLight", url)}
          />
          <ImageUploadField
            label="Dark logo"
            hint="used everywhere else (white backgrounds)"
            value={content.logoUrlDark}
            onChange={(url) => update("logoUrlDark", url)}
          />
        </div>
      </div>

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {content.goalLabels.map((label, i) => (
            <div key={i}>
              <div className="field">
                <label>Card {i + 1} title</label>
                <input value={label} onChange={(e) => updateArrayItem("goalLabels", i, e.target.value)} />
              </div>
              <ImageUploadField
                label="Card image"
                hint="leave blank to keep the color placeholder"
                value={content.goalImages[i] || ""}
                onChange={(url) => updateArrayItem("goalImages", i, url)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Conditions</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The 6 condition tiles under "Made for real-life health goals."
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {CONDITION_LABELS.map((label, i) => (
            <ImageUploadField
              key={i}
              label={label}
              hint="leave blank to keep the color placeholder"
              value={content.conditionImages[i] || ""}
              onChange={(url) => updateArrayItem("conditionImages", i, url)}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>How Health365 works</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The 4 process step images.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {PROCESS_LABELS.map((label, i) => (
            <ImageUploadField
              key={i}
              label={label}
              hint="leave blank to keep the color placeholder"
              value={content.processImages[i] || ""}
              onChange={(url) => updateArrayItem("processImages", i, url)}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>"Not another diet chart" image</h2>
        <ImageUploadField
          label="Approach section photo"
          hint="leave blank to keep the color placeholder"
          value={content.approachImageUrl}
          onChange={(url) => update("approachImageUrl", url)}
        />
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>Final CTA image</h2>
        <ImageUploadField
          label="\"365 days. One healthier you.\" background photo"
          hint="leave blank to keep the color placeholder"
          value={content.finalCtaImageUrl}
          onChange={(url) => update("finalCtaImageUrl", url)}
        />
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

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Offer popup</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          A small dismissible popup shown to visitors after they scroll or after a few seconds.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={content.popupEnabled}
              onChange={(e) => update("popupEnabled", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 600, fontSize: ".9rem" }}>Show the popup on the site</span>
          </label>
          <div className="field">
            <label>Message</label>
            <textarea rows={2} value={content.popupMessage} onChange={(e) => update("popupMessage", e.target.value)} placeholder="e.g. Your first consultation is free this month." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Button text</label>
              <input value={content.popupCtaText} onChange={(e) => update("popupCtaText", e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Button link</label>
              <input value={content.popupCtaLink} onChange={(e) => update("popupCtaLink", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Show it when the visitor…</label>
            <div className="toggle-group">
              <span className={`toggle-opt${content.popupTrigger === "time" ? " on" : ""}`} onClick={() => update("popupTrigger", "time")}>Waits a few seconds</span>
              <span className={`toggle-opt${content.popupTrigger === "scroll" ? " on" : ""}`} onClick={() => update("popupTrigger", "scroll")}>Scrolls down</span>
            </div>
          </div>
          <div className="field">
            <label>{content.popupTrigger === "time" ? "Seconds to wait" : "Percent scrolled"}</label>
            <input
              type="number"
              value={content.popupTriggerValue}
              onChange={(e) => update("popupTriggerValue", Number(e.target.value) || 0)}
              style={{ maxWidth: 140 }}
            />
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="submit" disabled={saving} className="pill pill-primary">
          {saving ? "Saving…" : "Save all changes"}
        </button>
        {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".88rem", fontWeight: 600 }}>✓ Saved — live on the site now</span>}
      </div>
    </form>
  );
}
