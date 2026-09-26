"use client";

import { useState } from "react";
import ImageUploadField from "../content/ImageUploadField";

type Action = "consult" | "plan" | "oncology" | "care" | "none";
interface Banner { id: string; title: string; text: string; buttonText: string; imageUrl: string; color: string; action: Action; enabled: boolean; }
interface Habit { id: string; tag: string; text: string; imageUrl: string; enabled: boolean; }
interface Slide { title: string; text: string; imageUrl: string; }
interface TodayCard { label: string; color: string; imageUrl: string; ringColor: string; }
interface Texts { upNext: string; water: string; progress: string; reviews: string; premiumTitle: string; premiumText: string; }
interface AppContent {
  todayCard: TodayCard;
  texts: Texts;
  menuIcons: Record<string, string>;
  apiBase: string;
  introSlides: Slide[];
  goalIcons: Record<string, string>;
  conditionIcons: Record<string, string>;
  banners: Banner[];
  habitCards: Habit[];
  habitsTitle: string;
  autoScroll: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  confettiEnabled: boolean;
  updatedAt: string;
}

const PALETTE = [
  { hex: "#4EAA67", name: "Green" },
  { hex: "#287379", name: "Teal" },
  { hex: "#E5394F", name: "Red" },
  { hex: "#CBDB3D", name: "Lime" },
  { hex: "#F6961D", name: "Orange" },
  { hex: "#9997C9", name: "Lavender" },
];
const ACTIONS: { key: Action; label: string }[] = [
  { key: "consult", label: "Open Consult / booking" },
  { key: "plan", label: "Open the user's diet plan" },
  { key: "oncology", label: "Book with Cancer Care selected" },
  { key: "care", label: "Message the care team" },
  { key: "none", label: "Nothing (just a banner)" },
];
const GOALS = [["lose", "Lose Weight"], ["gain", "Gain Weight"], ["better", "Eat Better"], ["condition", "Manage a Condition"]];
const CONDITIONS = [["diabetes", "Diabetes"], ["pcos", "PCOS"], ["thyroid", "Thyroid"], ["weight", "Weight Management"], ["cholesterol", "Cholesterol"], ["digestive", "Digestive Health"], ["oncology", "Cancer Care"]];
const MENU = [
  ["details", "My details"], ["weight", "Log weight"], ["goal", "Goal & conditions"], ["food", "Food preferences"],
  ["appointments", "My appointments"], ["sound", "Sound & vibration"], ["care", "Talk to care team"], ["join", "Join as a Dietitian"],
  ["privacy", "Privacy Policy"], ["terms", "Terms of Service"], ["login", "Log in / create account"], ["logout", "Log out"], ["delete", "Delete my account"],
];
const TEXTS: [keyof Texts, string, number][] = [
  ["upNext", "“Up next” card title", 40], ["water", "Water card title", 40], ["progress", "Progress card title", 40],
  ["reviews", "Reviews section title", 60], ["premiumTitle", "Consult tab — paid consultation title", 60], ["premiumText", "Consult tab — paid consultation text", 160],
];
const newId = () => Math.random().toString(36).slice(2, 10);

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2 }} />
      <span>
        <span style={{ fontWeight: 600, fontSize: ".92rem" }}>{label}</span>
        <span style={{ display: "block", fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 2 }}>{hint}</span>
      </span>
    </label>
  );
}

function Swatches({ value, onChange, extra }: { value: string; onChange: (hex: string) => void; extra?: { hex: string; name: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[...PALETTE, ...(extra || [])].map((p) => (
        <button key={p.hex} type="button" title={p.name} aria-label={p.name} onClick={() => onChange(p.hex)}
          style={{ width: 34, height: 34, borderRadius: 10, background: p.hex, cursor: "pointer", border: value === p.hex ? "3px solid var(--ink)" : "3px solid var(--line)" }} />
      ))}
    </div>
  );
}

function RowButtons({ i, len, move, remove }: { i: number; len: number; move: (i: number, d: number) => void; remove: (i: number) => void }) {
  const s = { background: "none", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 10px", fontSize: ".78rem", fontWeight: 700, cursor: "pointer" } as const;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button type="button" style={s} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
      <button type="button" style={s} disabled={i === len - 1} onClick={() => move(i, 1)}>↓</button>
      <button type="button" style={{ ...s, color: "var(--terracotta)" }} onClick={() => remove(i)}>Delete</button>
    </div>
  );
}

export default function AppContentForm({ initial }: { initial: AppContent }) {
  const [c, setC] = useState<AppContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<AppContent>) { setC((prev) => ({ ...prev, ...p })); setSaved(false); }
  function moveIn<T>(list: T[], i: number, d: number): T[] { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; }
  const setBanner = (i: number, p: Partial<Banner>) => patch({ banners: c.banners.map((b, k) => (k === i ? { ...b, ...p } : b)) });
  const setHabit = (i: number, p: Partial<Habit>) => patch({ habitCards: c.habitCards.map((h, k) => (k === i ? { ...h, ...p } : h)) });
  const setToday = (p: Partial<TodayCard>) => patch({ todayCard: { ...c.todayCard, ...p } });
  const setText = (k: keyof Texts, v: string) => patch({ texts: { ...c.texts, [k]: v } });
  const setSlide = (i: number, p: Partial<Slide>) => patch({ introSlides: c.introSlides.map((s, k) => (k === i ? { ...s, ...p } : s)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    const res = await fetch("/api/admin/app-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error || "Couldn't save — please try again."); return; }
    setC(data.content); setSaved(true);
  }

  const card = { border: "1.5px solid var(--line)", borderRadius: 14, padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 14 } as const;

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Today&apos;s target card</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The big card at the top of the home screen with calories, protein, carbs and fat. The numbers always come from the user&apos;s own plan.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field"><label>Label</label><input value={c.todayCard.label} maxLength={40} onChange={(e) => setToday({ label: e.target.value })} /></div>
          <div className="admin-grid-2" style={{ gap: 14 }}>
            <div className="field"><label>Card color</label><Swatches value={c.todayCard.color} onChange={(hex) => setToday({ color: hex })} /></div>
            <div className="field"><label>Meals-done ring color</label><Swatches value={c.todayCard.ringColor} onChange={(hex) => setToday({ ringColor: hex })} extra={[{ hex: "#FFF3E5", name: "Cream" }]} /></div>
          </div>
          <ImageUploadField label="Background photo" hint="optional — a soft dark overlay keeps the numbers readable" value={c.todayCard.imageUrl} onChange={(u) => setToday({ imageUrl: u })} />
          <div style={{ borderRadius: 18, padding: 18, color: c.todayCard.color === "#CBDB3D" ? "#1F2B2C" : "#fff", maxWidth: 360,
            background: c.todayCard.imageUrl ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)), url("${c.todayCard.imageUrl}") center/cover, ${c.todayCard.color}` : c.todayCard.color }}>
            <div style={{ fontSize: ".8rem", opacity: .85 }}>{c.todayCard.label || "Today's target"}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>1,750 <span style={{ fontSize: ".9rem" }}>kcal</span></div>
            <div style={{ fontSize: ".78rem", opacity: .8, marginTop: 4 }}>Preview</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Home &amp; consult screen text</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>Section titles in the app. Leave a field empty to go back to the default.</p>
        <div className="admin-grid-2" style={{ gap: 14 }}>
          {TEXTS.map(([k, label, max]) => (
            <div className="field" key={k}><label>{label}</label>
              {k === "premiumText"
                ? <textarea rows={2} value={c.texts[k]} maxLength={max} onChange={(e) => setText(k, e.target.value)} />
                : <input value={c.texts[k]} maxLength={max} onChange={(e) => setText(k, e.target.value)} />}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Profile menu icons</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Replace any icon on the Profile screen. Square PNG or SVG, transparent background, about 96×96. Empty = the app&apos;s built-in icon.
        </p>
        <div className="admin-grid-2" style={{ gap: 18 }}>
          {MENU.map(([k, label]) => (
            <ImageUploadField key={k} label={label} value={c.menuIcons[k] || ""} onChange={(u) => patch({ menuIcons: { ...c.menuIcons, [k]: u } })} />
          ))}
        </div>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Home banners</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Colored promo cards on the app&apos;s home screen. With more than one, they slide by automatically. The Cancer Care banner is
          managed separately under Site Content → Oncology.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {c.banners.map((b, i) => (
            <div key={b.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Toggle label={`Banner ${i + 1}`} hint={b.enabled ? "Showing in the app" : "Hidden"} value={b.enabled} onChange={(v) => setBanner(i, { enabled: v })} />
                <RowButtons i={i} len={c.banners.length} move={(k, d) => patch({ banners: moveIn(c.banners, k, d) })} remove={(k) => patch({ banners: c.banners.filter((_, j) => j !== k) })} />
              </div>
              <div className="field"><label>Title</label><input value={b.title} maxLength={80} onChange={(e) => setBanner(i, { title: e.target.value })} /></div>
              <div className="field"><label>Text</label><textarea rows={2} value={b.text} maxLength={200} onChange={(e) => setBanner(i, { text: e.target.value })} /></div>
              <div className="admin-grid-2" style={{ gap: 14 }}>
                <div className="field"><label>Button text</label><input value={b.buttonText} maxLength={40} onChange={(e) => setBanner(i, { buttonText: e.target.value })} placeholder="Book a consultation" /></div>
                <div className="field">
                  <label>When tapped</label>
                  <select value={b.action} onChange={(e) => setBanner(i, { action: e.target.value as Action })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "#fff", fontSize: ".92rem", fontFamily: "inherit" }}>
                    {ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Color</label>
                <Swatches value={b.color} onChange={(hex) => setBanner(i, { color: hex })} />
              </div>
              <ImageUploadField label="Background photo" hint="optional — sits behind the text" value={b.imageUrl} onChange={(u) => setBanner(i, { imageUrl: u })} />
            </div>
          ))}
          {c.banners.length < 8 && (
            <button type="button" className="pill pill-outline" style={{ alignSelf: "flex-start" }}
              onClick={() => patch({ banners: [...c.banners, { id: newId(), title: "", text: "", buttonText: "", imageUrl: "", color: "#4EAA67", action: "consult", enabled: true }] })}>
              + Add banner
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Habit cards carousel</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The photo cards that scroll across the home screen. Keep text short — about 8 to 10 words.
        </p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Section title</label>
          <input value={c.habitsTitle} maxLength={60} onChange={(e) => patch({ habitsTitle: e.target.value })} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {c.habitCards.map((h, i) => (
            <div key={h.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Toggle label={`Card ${i + 1}`} hint={h.enabled ? "Showing in the app" : "Hidden"} value={h.enabled} onChange={(v) => setHabit(i, { enabled: v })} />
                <RowButtons i={i} len={c.habitCards.length} move={(k, d) => patch({ habitCards: moveIn(c.habitCards, k, d) })} remove={(k) => patch({ habitCards: c.habitCards.filter((_, j) => j !== k) })} />
              </div>
              <div className="admin-grid-2" style={{ gap: 14 }}>
                <div className="field"><label>Tag</label><input value={h.tag} maxLength={20} onChange={(e) => setHabit(i, { tag: e.target.value })} placeholder="e.g. Habit" /></div>
                <div className="field"><label>Text</label><input value={h.text} maxLength={120} onChange={(e) => setHabit(i, { text: e.target.value })} /></div>
              </div>
              <ImageUploadField label="Photo" hint="optional — a built-in photo is used if empty" value={h.imageUrl} onChange={(u) => setHabit(i, { imageUrl: u })} />
            </div>
          ))}
          {c.habitCards.length < 12 && (
            <button type="button" className="pill pill-outline" style={{ alignSelf: "flex-start" }}
              onClick={() => patch({ habitCards: [...c.habitCards, { id: newId(), tag: "", text: "", imageUrl: "", enabled: true }] })}>
              + Add card
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Welcome slides</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          The 3 full-screen slides a new user sees before &quot;Get Started&quot;. Tall (portrait) photos work best.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {c.introSlides.map((s, i) => (
            <div key={i} style={card}>
              <p style={{ fontWeight: 700, fontSize: ".9rem" }}>Slide {i + 1}</p>
              <div className="field"><label>Headline</label><input value={s.title} maxLength={80} onChange={(e) => setSlide(i, { title: e.target.value })} /></div>
              <div className="field"><label>Text</label><textarea rows={2} value={s.text} maxLength={200} onChange={(e) => setSlide(i, { text: e.target.value })} /></div>
              <ImageUploadField label="Background photo" hint="optional" value={s.imageUrl} onChange={(u) => setSlide(i, { imageUrl: u })} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Goal icons</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Icons on the &quot;What brings you here?&quot; screen. Square PNG or SVG with a transparent background looks best.
        </p>
        <div className="admin-grid-2" style={{ gap: 18 }}>
          {GOALS.map(([k, label]) => (
            <ImageUploadField key={k} label={label} value={c.goalIcons[k] || ""} onChange={(u) => patch({ goalIcons: { ...c.goalIcons, [k]: u } })} />
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Condition icons</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 18 }}>
          Icons on the &quot;Any health condition?&quot; grid. Square PNG or SVG with a transparent background looks best.
        </p>
        <div className="admin-grid-2" style={{ gap: 18 }}>
          {CONDITIONS.map(([k, label]) => (
            <ImageUploadField key={k} label={label} value={c.conditionIcons[k] || ""} onChange={(u) => patch({ conditionIcons: { ...c.conditionIcons, [k]: u } })} />
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 18 }}>Motion, sound &amp; effects</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Toggle label="Auto-scroll carousels" hint="Home banners, habit cards and reviews slide by on their own." value={c.autoScroll} onChange={(v) => patch({ autoScroll: v })} />
          <Toggle label="Tap sounds" hint="Soft click on taps and a chime on big moments. Users can still turn this off in their own profile." value={c.soundEnabled} onChange={(v) => patch({ soundEnabled: v })} />
          <Toggle label="Vibration (haptics)" hint="Light buzz on taps, a stronger one when a plan is ready or a booking is confirmed." value={c.hapticsEnabled} onChange={(v) => patch({ hapticsEnabled: v })} />
          <Toggle label="Confetti celebrations" hint="Confetti when a diet plan is generated and when a consultation is booked." value={c.confettiEnabled} onChange={(v) => patch({ confettiEnabled: v })} />
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Website address (advanced)</h2>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 14 }}>
          Only change this after you connect your own domain in Vercel and it opens this same site. The app checks the new address works
          before it switches, and the old vercel.app address keeps working too. Example: https://health365.in
        </p>
        <div className="field"><label>Website address</label>
          <input value={c.apiBase} placeholder="https://health365-app1.vercel.app (current)" onChange={(e) => patch({ apiBase: e.target.value.trim() })} />
        </div>
      </div>

      {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button type="submit" disabled={saving} className="pill pill-primary">{saving ? "Saving…" : "Save app changes"}</button>
        {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".88rem", fontWeight: 600 }}>✓ Saved — the app picks this up next time it opens</span>}
      </div>
    </form>
  );
}
