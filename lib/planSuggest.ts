import type { Consultation } from "./kv";

// Starting values for a dietitian's plan, from the client's consultation form:
// goal, food type, conditions and a calorie target (Mifflin-St Jeor BMR ×
// activity, then −500 to lose / +300 to gain). The dietitian can change any of it.
export interface PlanSuggest { goal: string; diet: string; conditions: string[]; kcal: number; basis: string }

const num = (v: unknown) => parseFloat(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
const ACT: [RegExp, number, string][] = [[/very/i, 1.725, "Very active"], [/light/i, 1.375, "Lightly active"], [/active/i, 1.55, "Active"], [/sedent/i, 1.2, "Sedentary"]];
const COND: [RegExp, string][] = [[/diab|sugar/i, "diabetes"], [/pcos|pcod/i, "pcos"], [/thyro/i, "thyroid"], [/chol|lipid|heart/i, "cholesterol"], [/digest|gut|ibs|acid/i, "digestive"], [/weight/i, "weight"], [/cancer|onco/i, "oncology"]];

export function suggestFromConsultation(c: Consultation | undefined | null): PlanSuggest | null {
  if (!c) return null;
  const r = (c.raw || {}) as Record<string, unknown>;
  const g = String(c.goal || r.goal || "");
  const goal = /lose/i.test(g) ? "lose" : /gain/i.test(g) ? "gain" : /maintain/i.test(g) ? "maintain" : "better";
  const d = String(c.dietType || r.dietType || "");
  const diet = /vegan/i.test(d) ? "vegan" : /jain/i.test(d) ? "jain" : /egg/i.test(d) ? "eggetarian" : /non/i.test(d) ? "nonveg" : "veg";
  const conditions = [...new Set((c.conditions || []).map((x) => COND.find(([re]) => re.test(String(x)))?.[1]).filter(Boolean) as string[])].slice(0, 4);

  const kg = num(r.weight ?? r.weightKg), cm = num(r.height ?? r.heightCm), age = num(r.age);
  const male = /^m/i.test(String(r.gender || r.sex || ""));
  const act = ACT.find(([re]) => re.test(String(r.activity || ""))) || [null, 1.2, "Sedentary"];
  let kcal = 0; let basis = "";
  if (kg >= 25 && kg <= 250 && cm >= 100 && cm <= 230 && age >= 10 && age <= 100) {
    const bmr = 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
    let t = bmr * act[1];
    if (goal === "lose") t = Math.max(t - 500, male ? 1500 : 1200);
    if (goal === "gain") t += 300;
    kcal = Math.round(t / 50) * 50;
    basis = `${kg} kg · ${cm} cm · ${age} yrs · ${male ? "Male" : "Female"} · ${act[2]}`;
  }
  return { goal, diet, conditions, kcal, basis };
}
