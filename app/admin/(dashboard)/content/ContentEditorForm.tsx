"use client";

import { useState } from "react";
import ImageUploadField from "./ImageUploadField";

interface SectionVisibility {
  stats: boolean;
  goals: boolean;
  about: boolean;
  conditions: boolean;
  how: boolean;
  dietitian: boolean;
  testimonials: boolean;
  join: boolean;
}

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
  heroImageUrl2: string;
  heroImageUrl3: string;
  goalLabels: string[];
  logoUrlLight: string;
  logoUrlDark: string;
  themeAccentColor: string;
  themeButtonColor: string;
  heroTextOffsetY: number;
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
  popupImageUrl: string;
  popupHeadline: string;
  sectionsEnabled: SectionVisibility;
}

const SECTION_TOGGLES: { key: keyof SectionVisibility; label: string; hint: string }[] = [
  { key: "stats", label: "Stats row", hint: "the \"365 / 6+ / 1:1\" strip right under the hero" },
  { key: "goals", label: "\"What brings you here?\" goal cards", hint: "" },
  { key: "about", label: "\"Not another diet chart\" section", hint: "" },
  { key: "conditions", label: "Conditions tiles", hint: "" },
  { key: "how", label: "\"How Health365 works\" steps", hint: "" },
  { key: "dietitian", label: "Dr. Astha profile section", hint: "" },
  { key: "testimonials", label: "Testimonials", hint: "also hidden automatically if none are published" },
  { key: "join", label: "\"Join as a Dietitian\" banner", hint: "" },
];

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

  function updateSection(key: keyof SectionVisibility, value: boolean) {
    update("sectionsEnabled", { ...content.sectionsEnabled, [key]: value });
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
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Homepage sections</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Uncheck a section to hide it from the live homepage. The hero at the very top always stays visible.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {SECTION_TOGGLES.map(({ key, label, hint }) => (
            <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={content.sectionsEnabled[key]}
                onChange={(e) => updateSection(key, e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: ".9rem", display: "block" }}>{label}</span>
                {hint && <span style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>{hint}</span>}
              </span>
            </label>
          ))}
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
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Site colors</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Changes the sage-green accent and the black buttons/text used across the site. Pick a dark color for
          "Button &amp; text color" — a light one will make text hard to read.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="field">
            <label>Accent color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={content.themeAccentColor} onChange={(e) => update("themeAccentColor", e.target.value)} style={{ width: 44, height: 38, padding: 2, border: "1px solid var(--line)", borderRadius: 8 }} />
              <input value={content.themeAccentColor} onChange={(e) => update("themeAccentColor", e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="field">
            <label>Button &amp; text color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={content.themeButtonColor} onChange={(e) => update("themeButtonColor", e.target.value)} style={{ width: 44, height: 38, padding: 2, border: "1px solid var(--line)", borderRadius: 8 }} />
              <input value={content.themeButtonColor} onChange={(e) => update("themeButtonColor", e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Hero image</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Add up to 3 — with more than one, the hero automatically becomes a slideshow that fades between them.
        </p>
        <div className="field">
          <label>Text position</label>
          <div className="toggle-group">
            <span className={`toggle-opt${content.heroTextOffsetY < 0 ? " on" : ""}`} onClick={() => update("heroTextOffsetY", -1)}>Top</span>
            <span className={`toggle-opt${content.heroTextOffsetY === 0 ? " on" : ""}`} onClick={() => update("heroTextOffsetY", 0)}>Center</span>
            <span className={`toggle-opt${content.heroTextOffsetY > 0 ? " on" : ""}`} onClick={() => update("heroTextOffsetY", 1)}>Bottom</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ImageUploadField
            label="Hero background photo 1"
            hint="leave blank to keep the current color placeholder"
            value={content.heroImageUrl}
            onChange={(url) => update("heroImageUrl", url)}
          />
          <ImageUploadField
            label="Hero background photo 2"
            hint="optional"
            value={content.heroImageUrl2}
            onChange={(url) => update("heroImageUrl2", url)}
          />
          <ImageUploadField
            label="Hero background photo 3"
            hint="optional"
            value={content.heroImageUrl3}
            onChange={(url) => update("heroImageUrl3", url)}
          />
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
          The 6 condition tiles under "Made for real-life health goals." — these show as small icons now,
          not big photos. Upload a small square icon image, or leave blank for the default emoji.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {CONDITION_LABELS.map((label, i) => (
            <ImageUploadField
              key={i}
              label={label}
              hint="leave blank to keep the default icon"
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
          label={'"365 days. One healthier you." background photo'}
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
          A centered popup with an email signup, shown to visitors after they scroll or after a few seconds.
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
          <ImageUploadField
            label="Popup image"
            hint="optional — shown on the left side of the popup"
            value={content.popupImageUrl}
            onChange={(url) => update("popupImageUrl", url)}
          />
          <div className="field">
            <label>Headline</label>
            <input value={content.popupHeadline} onChange={(e) => update("popupHeadline", e.target.value)} placeholder="e.g. Unlock 10% Off Your First Consultation" />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea rows={2} value={content.popupMessage} onChange={(e) => update("popupMessage", e.target.value)} placeholder="e.g. Sign up and we'll send you a code for your first consultation." />
          </div>
          <div className="field">
            <label>Button text</label>
            <input value={content.popupCtaText} onChange={(e) => update("popupCtaText", e.target.value)} placeholder="Unlock Offer" />
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
