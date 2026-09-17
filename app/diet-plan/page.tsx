"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { slotLabels, slotOrder, pickMeal, MealItem } from "@/lib/mealPool";

const GOALS = ["Lose weight", "Gain weight", "Maintain weight", "Improve nutrition", "Manage a condition"];
const DIETS: [string, string][] = [
  ["veg", "Vegetarian"], ["jain", "Jain"], ["vegan", "Vegan"],
  ["eggetarian", "Eggetarian"], ["nonveg", "Non-vegetarian"], ["other", "Other"],
];
const ALLERGENS = ["nuts", "dairy", "gluten", "soy", "shellfish", "eggs"];

type DayPlan = { label: string; item: MealItem | null }[];

export default function DietPlanPage() {
  const [goal, setGoal] = useState(GOALS[0]);
  const [diet, setDiet] = useState("veg");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [length, setLength] = useState(1);
  const [generated, setGenerated] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  function buildDays(): DayPlan[] {
    const days: DayPlan[] = [];
    for (let d = 0; d < length; d++) {
      days.push(
        slotOrder.map((slot, i) => ({
          label: slotLabels[slot],
          item: pickMeal(diet, allergens, slot, d, i * 2),
        }))
      );
    }
    return days;
  }

  const days = generated ? buildDays() : [];
  const dietLabel = DIETS.find(([k]) => k === diet)?.[1] || diet;

  function toggleAllergen(a: string) {
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function downloadPdf() {
    setPdfStatus("Preparing…");
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = 0;

    const INK: [number, number, number] = [32, 36, 31];
    const INK_SOFT: [number, number, number] = [102, 107, 95];
    const TERRACOTTA: [number, number, number] = [201, 106, 60];
    const TEAL: [number, number, number] = [63, 127, 112];
    const PAPER: [number, number, number] = [244, 238, 224];
    const CREAM: [number, number, number] = [251, 247, 238];
    const LINE: [number, number, number] = [226, 222, 209];
    const WHITE: [number, number, number] = [255, 255, 255];

    function drawHeader() {
      doc.setFillColor(...INK);
      doc.rect(0, 0, pageW, 84, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(19);
      doc.setTextColor(...WHITE);
      doc.text("Health365", margin, 38);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      doc.setTextColor(178, 201, 192);
      doc.text("Your health, your 365.  ·  Personal Nutrition Plan", margin, 58);
      y = 84 + 32;
    }
    function ensureSpace(extra: number) {
      if (y + extra > pageH - 56) { doc.addPage(); drawHeader(); }
    }
    function pill(str: string, x: number, yy: number, fill: [number, number, number], text: [number, number, number]) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      const w = doc.getTextWidth(str) + 20, h = 20;
      doc.setFillColor(...fill);
      doc.roundedRect(x, yy, w, h, 10, 10, "F");
      doc.setTextColor(...text);
      doc.text(str, x + 10, yy + 13.5);
      return w;
    }
    function wrapPills(items: string[]) {
      let x = margin; const rowH = 28;
      ensureSpace(rowH);
      items.forEach((str) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        const w = doc.getTextWidth(str) + 20;
        if (x + w > pageW - margin) { x = margin; y += rowH; ensureSpace(rowH); }
        pill(str, x, y, PAPER, INK);
        x += w + 8;
      });
      y += rowH + 6;
    }
    function sectionTitle(str: string) {
      ensureSpace(30);
      doc.setDrawColor(...TEAL); doc.setLineWidth(2);
      doc.line(margin, y, margin + 26, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13.5);
      doc.setTextColor(...INK);
      doc.text(str, margin, y + 16);
      y += 30;
    }
    function mealCard(label: string, item: MealItem | null) {
      const lines = item ? doc.splitTextToSize("Alternative: " + item.alt, contentW - 70) : [];
      const h = item ? 58 + lines.length * 11 : 40;
      ensureSpace(h + 10);
      doc.setFillColor(...CREAM); doc.setDrawColor(...LINE); doc.setLineWidth(0.75);
      doc.roundedRect(margin, y, contentW, h, 8, 8, "FD");
      doc.setFillColor(...TERRACOTTA);
      doc.roundedRect(margin, y, 5, h, 2, 2, "F");
      const tx = margin + 20;
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      doc.setTextColor(...TERRACOTTA);
      doc.text(label.toUpperCase(), tx, y + 18);
      if (item) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(12.5);
        doc.setTextColor(...INK);
        doc.text(item.name, tx, y + 34);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.setTextColor(...INK_SOFT);
        doc.text(item.portion + "   ·   " + item.cal, tx, y + 48);
        doc.setFont("helvetica", "italic"); doc.setFontSize(8.7);
        doc.setTextColor(...TEAL);
        lines.forEach((line: string, i: number) => doc.text(line, tx, y + 48 + 12 + i * 11));
      } else {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9.5);
        doc.setTextColor(...INK_SOFT);
        doc.text("No match for your current filters — a dietitian can help widen these safely.", tx, y + 32);
      }
      y += h + 12;
    }

    drawHeader();
    wrapPills([`Goal: ${goal}`, `Diet: ${dietLabel}`, `Avoiding: ${allergens.length ? allergens.join(", ") : "None specified"}`, `Length: ${length} day${length > 1 ? "s" : ""}`]);

    days.forEach((meals, dIdx) => {
      if (days.length > 1) sectionTitle(`Day ${dIdx + 1}`);
      meals.forEach((m) => mealCard(m.label, m.item));
      y += 6;
    });

    ensureSpace(70);
    doc.setFillColor(...PAPER);
    doc.roundedRect(margin, y, contentW, 58, 8, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text("HYDRATION & MOVEMENT", margin + 18, y + 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    doc.text("Aim for 8–10 glasses of water spread through the day, and a 20–30 minute walk most days.", margin + 18, y + 34, { maxWidth: contentW - 36 });
    y += 70;

    const disc = 'This plan was generated automatically from general nutrition guidelines — it has not been reviewed by a dietitian and is not a medically prescribed diet. If you selected "Manage a condition," please book a consultation before making significant changes to your diet.';
    const discLines = doc.splitTextToSize(disc, contentW - 36);
    ensureSpace(24 + discLines.length * 11);
    doc.setDrawColor(...TERRACOTTA); doc.setLineWidth(1);
    doc.line(margin, y, margin, y + discLines.length * 11 + 14);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8.7);
    doc.setTextColor(...INK_SOFT);
    discLines.forEach((line: string, i: number) => doc.text(line, margin + 16, y + 10 + i * 11));

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...LINE); doc.setLineWidth(0.5);
      doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.setTextColor(...INK_SOFT);
      doc.text("Health365 — general nutrition guidance, not a medical diagnosis.", margin, pageH - 26);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 26, { align: "right" });
    }

    doc.save("health365-nutrition-plan.pdf");
    setPdfStatus("Saved.");
    setTimeout(() => setPdfStatus(null), 2500);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 920, paddingTop: 56, paddingBottom: 90 }}>
          <div style={{ marginBottom: 36 }}>
            <span className="eyebrow">Diet plan</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>Your basic nutrition plan</h1>
            <p style={{ marginTop: 14, fontSize: "1.02rem", maxWidth: "56ch" }}>
              Set your goal, food preference, and allergies below, and we&apos;ll put together a simple day — or week — of meals as a starting point.
            </p>
          </div>

          <div className="panel">
            <div style={{ marginBottom: 26 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Your goal</label>
              <div className="toggle-group">
                {GOALS.map((g) => (
                  <span key={g} className={`toggle-opt${goal === g ? " on" : ""}`} onClick={() => setGoal(g)}>{g}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 26 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Food preference</label>
              <div className="toggle-group">
                {DIETS.map(([k, label]) => (
                  <span key={k} className={`toggle-opt${diet === k ? " on" : ""}`} onClick={() => setDiet(k)}>{label}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 26 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>
                Allergies to avoid <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— select any that apply</span>
              </label>
              <div className="toggle-group">
                {ALLERGENS.map((a) => (
                  <span key={a} className={`toggle-opt${allergens.includes(a) ? " on" : ""}`} onClick={() => toggleAllergen(a)}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Plan length</label>
              <div className="length-toggle">
                <span className={`length-opt${length === 1 ? " on" : ""}`} onClick={() => setLength(1)}>1 Day</span>
                <span className={`length-opt${length === 7 ? " on" : ""}`} onClick={() => setLength(7)}>7 Day</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button className="pill pill-primary" onClick={() => { setGenerated(true); setActiveDay(1); }}>Generate My Plan</button>
            </div>
          </div>

          {generated && (
            <div style={{ marginTop: 44 }}>
              <div className="summary-strip">
                <div className="item"><div className="lbl">Goal</div><div className="val">{goal}</div></div>
                <div className="item"><div className="lbl">Food preference</div><div className="val">{dietLabel}</div></div>
                <div className="item"><div className="lbl">Avoiding</div><div className="val">{allergens.length ? allergens.join(", ") : "None specified"}</div></div>
                <div className="item"><div className="lbl">Plan length</div><div className="val">{length} day{length > 1 ? "s" : ""}</div></div>
                <button className="pill pill-outline" style={{ background: "transparent", borderColor: "rgba(255,255,255,.35)", color: "#fff" }} onClick={downloadPdf}>
                  Download PDF
                </button>
              </div>
              {pdfStatus && <p style={{ fontSize: ".8rem", marginTop: 10, color: "var(--teal)" }}>{pdfStatus}</p>}

              {goal === "Manage a condition" && (
                <div className="condition-banner">
                  <p>This is general guidance, not a condition-specific plan. For things like diabetes, PCOS, or thyroid, a dietitian should tailor this properly.</p>
                  <a href="/consultation" className="pill pill-outline" style={{ padding: "9px 18px", fontSize: ".8rem" }}>Book a Consultation</a>
                </div>
              )}

              {length > 1 && (
                <div className="day-tabs">
                  {Array.from({ length }, (_, i) => i + 1).map((d) => (
                    <span key={d} className={`day-tab${activeDay === d ? " on" : ""}`} onClick={() => setActiveDay(d)}>Day {d}</span>
                  ))}
                </div>
              )}

              <div className="meal-grid">
                {days[activeDay - 1]?.map((m, i) => (
                  <div className="meal-card" key={i}>
                    <span className="slot">{m.label}</span>
                    {m.item ? (
                      <>
                        <h3>{m.item.name}</h3>
                        <p className="portion">{m.item.portion}</p>
                        <span className="cal">{m.item.cal}</span>
                        <p className="alt"><b>Alternative:</b> {m.item.alt}</p>
                      </>
                    ) : (
                      <p className="empty-note">No match for your current filters — a dietitian can help widen these safely.</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="reminders">
                <div className="reminder-card"><span className="ic">💧</span><div><h3>Hydration</h3><p>Aim for 8–10 glasses of water spread through the day.</p></div></div>
                <div className="reminder-card"><span className="ic">🚶</span><div><h3>Movement</h3><p>A 20–30 minute walk most days supports whatever goal you picked.</p></div></div>
              </div>

              <p className="disclaimer">This plan was generated automatically from general nutrition guidelines — it has not been reviewed by a dietitian and is not a medically prescribed diet. If you selected &quot;Manage a condition,&quot; please book a consultation before making significant changes to your diet.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
