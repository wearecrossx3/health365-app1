"use client";

import { useState } from "react";
import { DIET_TEMPLATE_OPTIONS } from "@/lib/dietConditions";
import { slotLabels, slotOrder } from "@/lib/mealPool";

interface DietTemplateMeal {
  name: string;
  portion: string;
  cal: string;
  note: string;
}
interface DietTemplate {
  key: string;
  tips: string;
  meals: Record<string, DietTemplateMeal>;
  updatedAt?: string;
}

const EMPTY_MEAL: DietTemplateMeal = { name: "", portion: "", cal: "", note: "" };

function emptyTemplate(key: string): DietTemplate {
  const meals: Record<string, DietTemplateMeal> = {};
  slotOrder.forEach((slot) => (meals[slot] = { ...EMPTY_MEAL }));
  return { key, tips: "", meals };
}

function hasContent(t: DietTemplate): boolean {
  return slotOrder.some((slot) => t.meals[slot]?.name?.trim());
}

function TemplateCard({ initial }: { initial: DietTemplate }) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<DietTemplate>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const option = DIET_TEMPLATE_OPTIONS.find((o) => o.key === template.key)!;
  const configured = hasContent(template);

  function updateMeal(slot: string, field: keyof DietTemplateMeal, value: string) {
    setTemplate((t) => ({ ...t, meals: { ...t.meals, [slot]: { ...t.meals[slot], [field]: value } } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/diet-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  async function handleClear() {
    if (!confirm(`Clear the ${option.label} template? People will get the automatic plan again.`)) return;
    const cleared = emptyTemplate(template.key);
    setTemplate(cleared);
    setSaving(true);
    await fetch("/api/admin/diet-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleared),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: ".98rem" }}>{option.label}</span>
          <span
            style={{
              fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em",
              padding: "2px 9px", borderRadius: 100,
              background: configured ? "var(--sage)" : "var(--paper)",
              color: configured ? "var(--teal-deep)" : "var(--ink-soft)",
            }}
          >
            {configured ? "Configured" : "Not set — using automatic plan"}
          </span>
        </div>
        <span style={{ fontSize: "1.1rem", color: "var(--ink-soft)" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {slotOrder.map((slot) => (
            <div key={slot} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>
                {slotLabels[slot]}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Meal name</label>
                  <input
                    value={template.meals[slot]?.name || ""}
                    onChange={(e) => updateMeal(slot, "name", e.target.value)}
                    placeholder="e.g. Vegetable poha"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Portion</label>
                  <input
                    value={template.meals[slot]?.portion || ""}
                    onChange={(e) => updateMeal(slot, "portion", e.target.value)}
                    placeholder="e.g. 1 bowl"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Calories</label>
                  <input
                    value={template.meals[slot]?.cal || ""}
                    onChange={(e) => updateMeal(slot, "cal", e.target.value)}
                    placeholder="e.g. ~250 kcal"
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Alternative / note <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional</span></label>
                <input
                  value={template.meals[slot]?.note || ""}
                  onChange={(e) => updateMeal(slot, "note", e.target.value)}
                  placeholder="e.g. Swap for moong dal chilla if preferred"
                />
              </div>
            </div>
          ))}

          <div className="field" style={{ marginBottom: 0 }}>
            <label>General tips <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— shown under the meals</span></label>
            <textarea
              rows={2}
              value={template.tips}
              onChange={(e) => { setTemplate((t) => ({ ...t, tips: e.target.value })); setSaved(false); }}
              placeholder="e.g. Avoid refined sugar, prefer whole grains, walk 20-30 minutes daily."
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={handleSave} disabled={saving} className="pill pill-primary" style={{ padding: "9px 20px", fontSize: ".85rem" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            {configured && (
              <button type="button" onClick={handleClear} style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}>
                Clear template
              </button>
            )}
            {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".82rem", fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietPlansManager({ initial }: { initial: DietTemplate[] }) {
  const byKey = new Map(initial.map((t) => [t.key, t]));
  const goals = DIET_TEMPLATE_OPTIONS.filter((o) => o.group === "goal");
  const conditions = DIET_TEMPLATE_OPTIONS.filter((o) => o.group === "condition");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Basic goals</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {goals.map((o) => (
            <TemplateCard key={o.key} initial={byKey.get(o.key) || emptyTemplate(o.key)} />
          ))}
        </div>
      </div>
      <div>
        <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Conditions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {conditions.map((o) => (
            <TemplateCard key={o.key} initial={byKey.get(o.key) || emptyTemplate(o.key)} />
          ))}
        </div>
      </div>
    </div>
  );
}
