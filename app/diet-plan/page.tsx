"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { slotLabels, slotOrder, pickMeal, MealItem } from "@/lib/mealPool";
import { DIET_TEMPLATE_OPTIONS, GOAL_TO_TEMPLATE_KEY } from "@/lib/dietConditions";
import PremiumConsultModal from "@/components/PremiumConsultModal";

const GOALS = ["Lose weight", "Gain weight", "Maintain weight", "Improve nutrition", "Manage a condition"];
const CONSULT_CONDITION_MAP: Record<string, string> = { diabetes: "Diabetes", pcos: "PCOS", thyroid: "Thyroid", oncology: "Oncology" };
const DIETS: [string, string][] = [
  ["veg", "Vegetarian"], ["jain", "Jain"], ["vegan", "Vegan"],
  ["eggetarian", "Eggetarian"], ["nonveg", "Non-vegetarian"], ["other", "Other"],
];
const ALLERGENS = ["nuts", "dairy", "gluten", "soy", "shellfish", "eggs"];
const CONDITIONS = DIET_TEMPLATE_OPTIONS.filter((o) => o.group === "condition");

const GOAL_FROM_CONSULTATION: Record<string, string> = {
  "Lose weight": "Lose weight",
  "Gain weight": "Gain weight",
  "Maintain weight": "Maintain weight",
  "Improve nutrition": "Improve nutrition",
  "Condition-specific support": "Manage a condition",
};
const DIET_KEY_FROM_LABEL: Record<string, string> = {
  Vegetarian: "veg", Jain: "jain", Vegan: "vegan",
  Eggetarian: "eggetarian", "Non-vegetarian": "nonveg", Other: "other",
};

interface DietTemplateMeal { name: string; portion: string; cal: string; note: string; }
interface DietTemplate { key: string; tips: string; meals: Record<string, DietTemplateMeal>; }

type DayPlan = { label: string; item: MealItem | null }[];

export default function DietPlanPage() {
  return (
    <Suspense fallback={null}>
      <DietPlanContent />
    </Suspense>
  );
}

function DietPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [goal, setGoal] = useState(GOALS[0]);
  const [condition, setCondition] = useState(CONDITIONS[0].key);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState("");
  const [conditionFormError, setConditionFormError] = useState<string | null>(null);
  const [diet, setDiet] = useState("veg");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [length, setLength] = useState(1);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [waName, setWaName] = useState("");
  const [waStatus, setWaStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [waError, setWaError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, DietTemplate>>({});
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pricing, setPricing] = useState({ originalPrice: "2500", discountedPrice: "1500", upiId: "" });

  useEffect(() => {
    fetch("/api/diet-templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.templates && setTemplates(data.templates))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) =>
        setPricing({
          originalPrice: d.premiumOriginalPrice || "2500",
          discountedPrice: d.premiumDiscountedPrice || "1500",
          upiId: d.premiumUpiId || "",
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("condition")) return; // an explicit condition in the URL takes priority — skip past-consultation prefill
    fetch("/api/consultations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const latest = data?.consultations?.[0];
        if (!latest) return;
        const mappedGoal = GOAL_FROM_CONSULTATION[latest.goal];
        const mappedDiet = DIET_KEY_FROM_LABEL[latest.dietType];
        if (mappedGoal) setGoal(mappedGoal);
        if (mappedDiet) setDiet(mappedDiet);
        if (Array.isArray(latest.allergens)) {
          setAllergens(latest.allergens.map((a: string) => a.toLowerCase()));
        }
        setPrefillNote(
          `Prefilled from your consultation on ${new Date(latest.createdAt).toLocaleDateString()} — feel free to adjust before generating.`
        );
      })
      .catch(() => {});
  }, []);

  // Arriving from the Oncology banner (or any other "talk to a
  // specialist" link) with ?condition=oncology in the URL — jump
  // straight to the condition flow instead of the default goal.
  useEffect(() => {
    const urlCondition = searchParams.get("condition");
    if (urlCondition && CONDITIONS.some((c) => c.key === urlCondition)) {
      setGoal("Manage a condition");
      setCondition(urlCondition);
    }
  }, [searchParams]);

  const templateKey = goal === "Manage a condition" ? condition : GOAL_TO_TEMPLATE_KEY[goal];
  const activeTemplate = templates[templateKey];
  const templateHasMeals = !!activeTemplate && slotOrder.some((slot) => activeTemplate.meals[slot]?.name?.trim());

  // A template written by the admin is one basic day — force plan length
  // back to 1 whenever one becomes active, so we're not silently
  // repeating that single day across a "7 day" plan.
  useEffect(() => {
    if (templateHasMeals) setLength(1);
  }, [templateHasMeals]);

  function buildDays(): DayPlan[] {
    if (templateHasMeals && activeTemplate) {
      const day: DayPlan = slotOrder.map((slot) => {
        const m = activeTemplate.meals[slot];
        return {
          label: slotLabels[slot],
          item: m?.name?.trim()
            ? { name: m.name, portion: m.portion, cal: m.cal, alt: m.note, diets: [], allergens: [] }
            : null,
        };
      });
      return [day];
    }
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
      const altLabel = templateHasMeals ? "Note: " : "Alternative: ";
      const lines = item && item.alt ? doc.splitTextToSize(altLabel + item.alt, contentW - 70) : [];
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

    const disc = templateHasMeals
      ? 'This plan was prepared by the Health365 team as general guidance — it is not a medically prescribed diet. Please check with a dietitian before making significant changes if you have a diagnosed condition.'
      : 'This plan was generated automatically from general nutrition guidelines — it has not been reviewed by a dietitian and is not a medically prescribed diet. If you selected "Manage a condition," please book a consultation before making significant changes to your diet.';
    const discLines = doc.splitTextToSize(disc, contentW - 36);
    ensureSpace(24 + discLines.length * 11);
    doc.setDrawColor(...TERRACOTTA); doc.setLineWidth(1);
    doc.line(margin, y, margin, y + discLines.length * 11 + 14);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8.7);
    doc.setTextColor(...INK_SOFT);
    discLines.forEach((line: string, i: number) => doc.text(line, margin + 16, y + 10 + i * 11));

    const totalPages = doc.getNumberOfPages();
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
            <span className="eyebrow">{goal === "Manage a condition" ? "Specialist consultation" : "Diet plan"}</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>
              {goal === "Manage a condition" ? "Talk to a specialist dietitian" : "Your basic nutrition plan"}
            </h1>
            <p style={{ marginTop: 14, fontSize: "1.02rem", maxWidth: "56ch" }}>
              {goal === "Manage a condition"
                ? "Tell us a little about your condition and you'll be connected with a dietitian who specializes in it — no generic plan, no guesswork."
                : "Set your goal, food preference, and allergies below, and we'll put together a simple day — or week — of meals as a starting point."}
            </p>
          </div>

          <div className="panel">
            {prefillNote && (
              <div style={{ background: "#EAF3EF", border: "1px solid var(--teal)", color: "var(--teal-deep)", borderRadius: 12, padding: "12px 16px", fontSize: ".85rem", marginBottom: 22 }}>
                {prefillNote}
              </div>
            )}
            <div style={{ marginBottom: 26 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Your goal</label>
              <div className="toggle-group">
                {GOALS.map((g) => (
                  <span key={g} className={`toggle-opt${goal === g ? " on" : ""}`} onClick={() => { setGoal(g); setGenerated(false); }}>{g}</span>
                ))}
              </div>
            </div>
            {goal === "Manage a condition" && (
              <div style={{ marginBottom: 26 }}>
                <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Which condition?</label>
                <div className="toggle-group">
                  {CONDITIONS.map((c) => (
                    <span key={c.key} className={`toggle-opt${condition === c.key ? " on" : ""}`} onClick={() => setCondition(c.key)}>{c.label}</span>
                  ))}
                </div>
              </div>
            )}
            {goal !== "Manage a condition" && (
              <>
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
              </>
            )}
            {goal === "Manage a condition" && (
              <div style={{ marginBottom: 26 }}>
                <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Your details</label>
                <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginBottom: 14 }}>
                  Conditions need a dietitian&apos;s eye rather than a generic plan — share your details and you&apos;ll go straight to booking a consultation, no free plan here.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  <input
                    value={consultName}
                    onChange={(e) => { setConsultName(e.target.value); setConditionFormError(null); }}
                    placeholder="Your name"
                    style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".9rem" }}
                  />
                  <input
                    value={consultPhone}
                    onChange={(e) => { setConsultPhone(e.target.value); setConditionFormError(null); }}
                    placeholder="Phone number"
                    style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".9rem" }}
                  />
                </div>
                {conditionFormError && <p style={{ color: "var(--terracotta)", fontSize: ".82rem", marginTop: 10 }}>{conditionFormError}</p>}
              </div>
            )}
            {goal !== "Manage a condition" && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: ".88rem", display: "block", marginBottom: 10 }}>Plan length</label>
              <div className="length-toggle">
                <span className={`length-opt${length === 1 ? " on" : ""}`} onClick={() => setLength(1)}>1 Day</span>
                <span
                  className={`length-opt${length === 7 ? " on" : ""}`}
                  style={templateHasMeals ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                  onClick={() => !templateHasMeals && setLength(7)}
                >
                  7 Day
                </span>
              </div>
              {templateHasMeals && (
                <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 8 }}>
                  This is a prepared one-day plan for your selection, so 7-day isn&apos;t available here.
                </p>
              )}
            </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              {goal === "Manage a condition" ? (
                <button
                  className="pill pill-primary"
                  onClick={() => {
                    if (!consultName.trim() || !consultPhone.trim()) {
                      setConditionFormError("Please share your name and phone number.");
                      return;
                    }
                    const mapped = CONSULT_CONDITION_MAP[condition];
                    const params = new URLSearchParams({ name: consultName, phone: consultPhone });
                    if (mapped) params.set("condition", mapped);
                    router.push(`/dietitians?${params.toString()}`);
                  }}
                >
                  Continue
                </button>
              ) : (
                <button className="pill pill-primary" onClick={() => { setGenerated(true); setActiveDay(1); }}>Generate My Plan</button>
              )}
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
                <button className="pill pill-primary" onClick={() => setShowPremiumModal(true)}>
                  Consult a Dietitian
                </button>
              </div>
              {pdfStatus && <p style={{ fontSize: ".8rem", marginTop: 10, color: "var(--teal)" }}>{pdfStatus}</p>}

              <div style={{ marginTop: 16, background: "var(--paper)", borderRadius: 14, padding: "14px 18px" }}>
                {waStatus === "sent" ? (
                  <p style={{ fontSize: ".85rem", color: "var(--teal-deep)", fontWeight: 600 }}>✓ Sent to your WhatsApp</p>
                ) : (
                  <>
                    <p style={{ fontSize: ".85rem", fontWeight: 600 }}>📱 Want this plan on WhatsApp too?</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      <input
                        value={waName}
                        onChange={(e) => setWaName(e.target.value)}
                        placeholder="Your name"
                        style={{ flex: "1 1 160px", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".85rem" }}
                      />
                      <input
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                        placeholder="WhatsApp number"
                        style={{ flex: "1 1 160px", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".85rem" }}
                      />
                      <button
                        className="pill pill-outline"
                        style={{ padding: "9px 18px", fontSize: ".82rem" }}
                        disabled={waStatus === "sending"}
                        onClick={async () => {
                          if (!waPhone.trim()) { setWaError("Please enter a phone number."); return; }
                          setWaError(null);
                          setWaStatus("sending");
                          const res = await fetch("/api/whatsapp-plan", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: waPhone, name: waName, planSummary: `${goal}, ${dietLabel}, ${length} day${length > 1 ? "s" : ""}` }),
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            setWaError(data.error || "Couldn't send — please try again.");
                            setWaStatus("error");
                            return;
                          }
                          setWaStatus("sent");
                        }}
                      >
                        {waStatus === "sending" ? "Sending…" : "Send"}
                      </button>
                    </div>
                    {waError && <p style={{ color: "var(--terracotta)", fontSize: ".78rem", marginTop: 8 }}>{waError}</p>}
                  </>
                )}
              </div>

              {goal === "Manage a condition" && !templateHasMeals && (
                <div className="condition-banner">
                  <p>This is general guidance, not a condition-specific plan. For things like diabetes, PCOS, or thyroid, a dietitian should tailor this properly.</p>
                  <a href="/consultation" className="pill pill-outline" style={{ padding: "9px 18px", fontSize: ".8rem" }}>Book a Consultation</a>
                </div>
              )}

              {templateHasMeals && (
                <div style={{ background: "#EAF3EF", border: "1px solid var(--teal)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
                  <p style={{ fontSize: ".85rem", color: "var(--teal-deep)", fontWeight: 600 }}>
                    Prepared by the Health365 team{goal === "Manage a condition" ? ` for ${CONDITIONS.find((c) => c.key === condition)?.label}` : ""}.
                  </p>
                  {activeTemplate?.tips && (
                    <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginTop: 6 }}>{activeTemplate.tips}</p>
                  )}
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
                        {m.item.alt && <p className="alt"><b>{templateHasMeals ? "Note:" : "Alternative:"}</b> {m.item.alt}</p>}
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

              <p className="disclaimer">
                {templateHasMeals
                  ? "This plan was prepared by the Health365 team as general guidance — it is not a medically prescribed diet. Please check with a dietitian before making significant changes if you have a diagnosed condition."
                  : <>This plan was generated automatically from general nutrition guidelines — it has not been reviewed by a dietitian and is not a medically prescribed diet. If you selected &quot;Manage a condition,&quot; please book a consultation before making significant changes to your diet.</>}
              </p>
            </div>
          )}
        </div>
      </main>

      {showPremiumModal && (
        <PremiumConsultModal
          originalPrice={pricing.originalPrice}
          discountedPrice={pricing.discountedPrice}
          upiId={pricing.upiId}
          planSummary={`${goal}${goal === "Manage a condition" ? ` — ${CONDITIONS.find((c) => c.key === condition)?.label}` : ""}, ${dietLabel}, ${length} day${length > 1 ? "s" : ""}`}
          onClose={() => setShowPremiumModal(false)}
        />
      )}

      <SiteFooter />
    </>
  );
}
