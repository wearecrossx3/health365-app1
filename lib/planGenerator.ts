import foodDb from "./data/health365-foods.json";

// Realistic Indian 7-day (or 1-day) diet plan generator.
//
// Every meal is a real Indian thali/plate built from dishes whose calories
// and macros are computed from openly licensed USDA FoodData Central values
// (public domain). Plans follow the user's goal, diet type, region and health
// conditions, rotate dishes across the week, and scale roti / rice / portion
// sizes so each day lands close to the calorie target.
//
// Used by: Admin → Plan Generator (to assign plans), and the app's
// /api/app/generate-plan (so the app's own plans are just as realistic).

export interface Dish {
  id: string;
  name: string;
  aliases: string;
  group: string;
  serving: string;
  servingG: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fibre: number;
  recipe: [string, number][];
}

export type Goal = "lose" | "gain" | "maintain" | "better";
export type DietType = "veg" | "eggetarian" | "nonveg" | "jain" | "vegan";
export type Region = "gujarati" | "north" | "south" | "mixed";
export type Condition = "diabetes" | "pcos" | "thyroid" | "cholesterol" | "digestive" | "oncology" | "weight";

export interface PlanInput {
  goal: Goal;
  diet: DietType;
  region: Region;
  conditions: Condition[];
  targetKcal?: number;
  days?: number; // 1 or 7
  seed?: number;
  name?: string;
  avoid?: string[]; // allergies / foods avoided: dairy, gluten, nuts, peanut, egg, soy, shellfish, mushroom, spicy, sour
}

export interface PlanItem { name: string; portion: string; kcal: number; protein: number }
export interface PlanMeal {
  slot: string;
  label: string;
  time: string;
  title: string;
  items: PlanItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  alt: string;
}
export interface PlanDay { day: number; label: string; meals: PlanMeal[]; kcal: number; protein: number; carbs: number; fat: number; fibre: number }
export interface GeneratedPlan {
  title: string;
  goal: Goal;
  diet: DietType;
  region: Region;
  conditions: Condition[];
  targetKcal: number;
  days: PlanDay[];
  tips: string[];
  source: string;
  createdAt: string;
}

const DISHES: Dish[] = (foodDb as unknown as { dishes: Dish[] }).dishes;
const D = (id: string) => {
  const d = DISHES.find((x) => x.id === "D" + id);
  if (!d) throw new Error(`Unknown dish ${id}`);
  return d;
};

// ——— Dish tags, derived from each dish's ingredient recipe ———
const codes = (d: Dish) => d.recipe.map(([c]) => c);
const grams = (d: Dish, pred: (c: string) => boolean) => d.recipe.filter(([c]) => pred(c)).reduce((s, [, g]) => s + g, 0);
const isMeat = (d: Dish) => codes(d).some((c) => /^[NOPQRS]\d/.test(c));
const isEgg = (d: Dish) => codes(d).some((c) => /^M\d/.test(c));
const isDairy = (d: Dish) => codes(d).some((c) => /^L\d/.test(c) || c === "GHEE" || c === "BUTTER");
const isRootOrOnion = (d: Dish) => codes(d).some((c) => /^F\d/.test(c) || ["G017", "G018", "G011", "G012", "G013", "G014"].includes(c));
const isFried = (d: Dish) => grams(d, (c) => c === "OIL" || c === "GHEE" || c === "BUTTER") >= 10 || /puri|samosa|vada|pakod/i.test(d.name);
const sugarG = (d: Dish) => grams(d, (c) => c === "SUGAR" || c === "I001" || c === "I002");
const isRedMeat = (d: Dish) => codes(d).some((c) => /^O\d/.test(c));
const isHeavyLegume = (d: Dish) => codes(d).some((c) => ["B002", "B020", "B004"].includes(c));

// Allergy / avoid list → ingredient codes that must not appear.
const AVOID_CODES: Record<string, (c: string) => boolean> = {
  dairy: (c) => /^L\d/.test(c) || c === "GHEE" || c === "BUTTER",
  gluten: (c) => ["A018", "A019", "A020", "A021", "A022", "A023", "A024", "A004"].includes(c),
  nuts: (c) => ["H001", "H005", "H017", "H018", "H021", "H012"].includes(c),
  peanut: (c) => c === "H012",
  egg: (c) => /^M\d/.test(c),
  shellfish: (c) => /^[QR]\d/.test(c) || ["S007", "S008", "S009", "S010"].includes(c),
  mushroom: (c) => /^J\d/.test(c),
  soy: (c) => ["B024", "B025"].includes(c),
  sour: (c) => ["E033", "E064", "E047", "E034"].includes(c),
  spicy: (c) => /^G00[1-8]$/.test(c) || c === "G022",
};

function allowed(d: Dish, inp: PlanInput): boolean {
  const c = new Set(inp.conditions);
  for (const a of inp.avoid || []) {
    const hit = AVOID_CODES[a];
    if (hit && codes(d).some(hit)) return false;
  }
  if (inp.diet !== "nonveg" && isMeat(d)) return false;
  if ((inp.diet === "veg" || inp.diet === "jain" || inp.diet === "vegan") && isEgg(d)) return false;
  if (inp.diet === "jain" && isRootOrOnion(d)) return false;
  if (inp.diet === "vegan" && isDairy(d)) return false;
  if ((c.has("diabetes") || c.has("pcos")) && sugarG(d) >= 4) return false;
  if ((c.has("cholesterol") || c.has("digestive")) && isFried(d)) return false;
  if (c.has("cholesterol") && isRedMeat(d)) return false;
  if (c.has("digestive") && isHeavyLegume(d)) return false;
  if (inp.goal === "lose" && isFried(d)) return false;
  if ((inp.goal === "lose" || c.has("diabetes") || c.has("pcos")) && ["DS01", "DR04"].includes(d.id)) return false;
  return true;
}

// ——— Seeded random, so "regenerate" gives a new plan but the same seed is repeatable ———
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ——— Portion helpers ———
// "2 pieces" × 1.5 → "3 pieces"; "1 katori" × 0.5 → "½ katori"
function scalePortion(serving: string, q: number): string {
  if (q === 1) return serving;
  const m = serving.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const fmt = (n: number) => {
    const whole = Math.floor(n + 1e-9);
    const frac = n - whole;
    const f = Math.abs(frac - 0.5) < 0.01 ? "½" : Math.abs(frac - 0.25) < 0.01 ? "¼" : Math.abs(frac - 0.75) < 0.01 ? "¾" : "";
    if (!f && frac > 0.01) return String(Math.round(n * 10) / 10);
    return whole ? `${whole}${f}` : f || "0";
  };
  if (m) {
    const n = parseFloat(m[1]) * q;
    let unit = m[2];
    if (n > 1 && /^(piece|egg|slice|glass|cup|bowl|katori|plate|handful|white)$/i.test(unit.split(" ").pop() || "")) {
      unit = unit.replace(/(piece|egg|slice|glass|cup|bowl|plate|handful|white)$/i, (w) => (/glass$/i.test(w) ? w + "es" : w + "s"));
    }
    return `${fmt(n)} ${unit}`.trim();
  }
  return `${fmt(q)} × ${serving}`;
}

const item = (id: string, q = 1): { d: Dish; q: number } => ({ d: D(id), q });

interface Pick { d: Dish; q: number }
interface MealDraft { parts: Pick[]; scalable: number | null; steps: number[]; title?: string }

function mealFrom(parts: Pick[], scalable: number | null, steps: number[]): MealDraft {
  return { parts, scalable, steps };
}

// Drops side items the person can't eat (e.g. curd for a vegan); drops the
// whole meal if its main dish isn't allowed.
function clean(m: MealDraft, inp: PlanInput): MealDraft | null {
  const main = m.scalable ?? 0;
  if (!allowed(m.parts[main].d, inp)) return null;
  const keep = m.parts.map((p, i) => i === main || allowed(p.d, inp));
  const parts = m.parts.filter((_, i) => keep[i]);
  const scalable = m.scalable === null ? null : keep.slice(0, m.scalable).filter(Boolean).length;
  return { ...m, parts, scalable };
}
const cleanAll = (list: MealDraft[], inp: PlanInput) => list.map((m) => clean(m, inp)).filter((m): m is MealDraft => m !== null);

function sumMeal(parts: Pick[]) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const p of parts) {
    t.kcal += p.d.kcal * p.q; t.protein += p.d.protein * p.q; t.carbs += p.d.carbs * p.q; t.fat += p.d.fat * p.q; t.fibre += p.d.fibre * p.q;
  }
  return t;
}

// Picks the staple quantity (roti count, rice katori, idli count…) that gets
// the meal closest to its calorie share without leaving the realistic range.
function fitMeal(m: MealDraft, target: number): Pick[] {
  if (m.scalable === null) return m.parts;
  let best = m.parts, bestDiff = Infinity;
  for (const q of m.steps) {
    const parts = m.parts.map((p, i) => (i === m.scalable ? { ...p, q } : p));
    const diff = Math.abs(sumMeal(parts).kcal - target);
    if (diff < bestDiff) { best = parts; bestDiff = diff; }
  }
  return best;
}

// ——— Meal pools ———
const ROTI_STEPS = [1, 2, 3, 4];
const RICE_STEPS = [0.5, 0.75, 1, 1.5];
const ONE_TWO = [1, 1.5, 2];

function staples(inp: PlanInput, meal: "lunch" | "dinner"): { id: string; steps: number[] }[] {
  const c = new Set(inp.conditions);
  const lowGi = c.has("diabetes") || c.has("pcos");
  const rotis = [{ id: "R01", steps: ROTI_STEPS }];
  const millets = [{ id: "R06", steps: [1, 2] }, { id: "R07", steps: [1, 2, 3] }, { id: "R08", steps: [1, 2, 3] }];
  if (inp.region === "gujarati") rotis.push({ id: "R05", steps: [1, 2, 3] });
  const ok = (l: { id: string; steps: number[] }[]) => {
    const f = l.filter((x) => allowed(D(x.id), inp));
    return f.length ? f : [{ id: "C01", steps: RICE_STEPS }];
  };
  if (meal === "dinner") return ok(lowGi ? [...millets, ...rotis] : [...rotis, ...millets]);
  return ok(lowGi ? [...rotis, ...millets] : [...rotis, ...millets.slice(0, 1)]);
}

const DALS: Record<Region, string[]> = {
  gujarati: ["L02", "L03", "L09", "L10", "L01", "S16"],
  north: ["L01", "L03", "L04", "L05", "L06", "L07", "L11"],
  south: ["L08", "L12", "L01", "L03", "L04"],
  mixed: ["L01", "L02", "L03", "L04", "L06", "L07", "L08", "L09", "L10", "L11"],
};
const SABZIS = ["S02", "S03", "S04", "S05", "S06", "S07", "S09", "S11", "S12", "S13", "S15", "S18", "S01", "S08", "S10", "S17", "S14"];
const NONVEG_CURRIES = ["N04", "N07", "N06", "N08", "N10"];
const EGG_CURRIES = ["N10"];

function breakfastOptions(inp: PlanInput): MealDraft[] {
  const c = new Set(inp.conditions);
  const o: MealDraft[] = [
    mealFrom([item("B01"), item("M11")], 0, [0.75, 1, 1.25]),
    mealFrom([item("B02"), item("X08")], 0, [0.75, 1, 1.25]),
    mealFrom([item("B03"), item("L08", 0.75), item("X09")], 0, ONE_TWO),
    mealFrom([item("B04"), item("L08", 0.75), item("X09")], 0, [1, 1.5, 2]),
    mealFrom([item("B07"), item("X08"), item("M01", 0.75)], 0, ONE_TWO),
    mealFrom([item("B08"), item("X08"), item("M01", 0.75)], 0, ONE_TWO),
    mealFrom([item("B09"), item("X08")], 0, [0.75, 1, 1.5]),
    mealFrom([item("B10"), item("X08"), item("M11")], 0, [1, 1.5, 2]),
    mealFrom([item("B13"), item("M01", 0.75)], 0, [0.75, 1, 1.25]),
    mealFrom([item("B11"), item("M11")], 0, [1, 1.5]),
    mealFrom([item("B15"), item("M11")], 0, [1, 1.5, 2]),
    mealFrom([item("B14"), item("X09")], 0, ONE_TWO),
    mealFrom([item("B06"), item("L08", 0.75)], 0, [0.75, 1, 1.5]),
    mealFrom([item("R05"), item("M01", 0.75)], 0, [1, 2, 3]),
    mealFrom([item("B16"), item("M01", 0.75)], 0, [1, 1.5, 2]),
    mealFrom([item("R04"), item("M01", 0.75)], 0, [1, 1.5, 2]),
    mealFrom([item("B12")], 0, [0.75, 1, 1.25]),
    mealFrom([item("N02"), item("R01", 2)], 1, [1, 2]),
    mealFrom([item("N01", 2), item("F01")], 0, [1, 2, 3]),
    mealFrom([item("N03"), item("B15")], 1, [0.5, 1]),
    mealFrom([item("S10", 0.75), item("R01", 2)], 1, [1, 2, 3]),
  ];
  const regionPref: Record<Region, string[]> = {
    gujarati: ["B09", "B10", "R05", "B01", "B07", "B08", "B02", "B13", "B16", "B11"],
    north: ["R04", "B16", "B07", "B08", "B01", "B02", "B13", "B15", "B11", "S10"],
    south: ["B03", "B04", "B06", "B14", "B02", "B01", "B11", "B13"],
    mixed: [],
  };
  let opts = cleanAll(o, inp);
  if (c.has("diabetes") || c.has("pcos")) opts = opts.filter((m) => !["R04", "B12", "B01"].includes(m.parts[0].d.id.slice(1)));
  const pref = regionPref[inp.region];
  if (pref.length) {
    const preferred = opts.filter((m) => pref.includes(m.parts[0].d.id.slice(1)));
    const egg = opts.filter((m) => isEgg(m.parts[0].d) || isMeat(m.parts[0].d));
    if (preferred.length >= 4) opts = [...preferred, ...egg.filter((e) => !preferred.includes(e))];
  }
  return opts.length ? opts : cleanAll([mealFrom([item("B11")], 0, [1, 1.5])], inp).concat([mealFrom([item("K17")], null, [])]);
}

function fruitIds(inp: PlanInput): string[] {
  const c = new Set(inp.conditions);
  const lowGi = c.has("diabetes") || c.has("pcos");
  const all = ["F02", "F03", "F04", "F05", "F08", "F12", "F11", "F01", "F06", "F07", "F09", "F10", "K17"];
  return lowGi ? ["F02", "F04", "F05", "F08", "F03", "F12"] : all;
}

function midMorningOptions(inp: PlanInput, r: () => number): MealDraft[] {
  const fruits = fruitIds(inp).map((id) => mealFrom([item(id)], null, []));
  const others = [
    mealFrom([item("M02")], null, []),
    mealFrom([item("M08")], null, []),
    mealFrom([item("K16", 1), item("F02", 0.5)], null, []),
    mealFrom([item("B11", 0.75)], null, []),
  ];
  return shuffle([...fruits, ...fruits.slice(0, 3), ...cleanAll(others, inp)], r);
}

function eveningOptions(inp: PlanInput): MealDraft[] {
  const c = new Set(inp.conditions);
  const tea = c.has("diabetes") || c.has("pcos") || inp.goal === "lose" ? "M11" : "M05";
  const o = [
    mealFrom([item(tea), item("K05")], 1, [0.75, 1, 1.5]),
    mealFrom([item("M12"), item("K18")], 1, [0.75, 1, 1.5]),
    mealFrom([item("M02"), item("K04", 0.5)], 1, [0.5, 1]),
    mealFrom([item("K17")], 0, [0.75, 1]),
    mealFrom([item(tea), item("B09", 0.5)], 1, [0.5, 0.75, 1]),
    mealFrom([item("X02"), item("K05", 0.5)], 1, [0.5, 1]),
    mealFrom([item("X10")], 0, [1, 1.25]),
    mealFrom([item("M12"), item("K12", 0.75)], 1, [0.5, 0.75, 1]),
    mealFrom([item(tea), item("B11", 0.75)], 1, [0.5, 0.75, 1]),
  ];
  const ok = cleanAll(o, inp);
  return ok.length ? ok : [mealFrom([item("K17")], null, [])];
}

function lunchFor(inp: PlanInput, r: () => number, dayIdx: number, used: Set<string>): MealDraft {
  const c = new Set(inp.conditions);
  const nonVegDay = inp.diet === "nonveg" && dayIdx % 3 === 1;
  const dal = pickUnused(DALS[inp.region].filter((id) => allowed(D(id), inp)), r, used) || "L03";
  const sabzi = pickUnused(SABZIS.filter((id) => allowed(D(id), inp)), r, used) || "S06";
  const salad = item("X01");
  const curdId = inp.diet === "vegan" ? null : inp.region === "gujarati" || r() < 0.5 ? "M02" : "M01";
  const side = curdId ? [item(curdId)] : [];
  if (inp.region === "south" || (inp.region === "mixed" && r() < 0.3)) {
    const rice = c.has("diabetes") ? "C03" : "C01";
    const main = nonVegDay ? pickUnused(NONVEG_CURRIES.filter((id) => allowed(D(id), inp)), r, used) || "N07" : dal;
    return mealFrom([item(rice), item(main), item(sabzi), salad, ...side], 0, c.has("diabetes") || inp.goal === "lose" ? [0.5, 0.75, 1] : RICE_STEPS);
  }
  const st = staples(inp, "lunch");
  const s = st[Math.floor(r() * Math.min(st.length, 2))];
  const main = nonVegDay ? pickUnused(NONVEG_CURRIES.filter((id) => allowed(D(id), inp)), r, used) || dal : dal;
  const parts = [item(s.id, 2), item(main), item(sabzi), salad, ...side];
  // Gujarati thali: a small katori of rice alongside the rotli
  if (inp.region === "gujarati" && s.id !== "C01" && !c.has("diabetes") && inp.goal !== "lose") parts.push(item("C01", 0.5));
  return mealFrom(parts, 0, s.steps);
}

function dinnerFor(inp: PlanInput, r: () => number, dayIdx: number, used: Set<string>): MealDraft {
  const c = new Set(inp.conditions);
  const kind = dayIdx % 7;
  const sabzi = pickUnused(SABZIS.filter((id) => allowed(D(id), inp) && !used.has(id)), r, used) || "S06";
  // One-pot nights (khichdi + kadhi / soup) twice a week — lighter and very "ghar ka khana".
  if (kind === 2 || kind === 5) {
    const k = pickUnused(["C04", "C07", "C08"].filter((id) => allowed(D(id), inp)), r, used) || "C04";
    const withDish = inp.diet === "vegan" ? "X02" : inp.region === "gujarati" ? "L09" : "X07";
    return mealFrom([item(k), item(withDish), item("X01", 0.5)], 0, [0.75, 1, 1.5]);
  }
  if (kind === 4 && inp.region !== "south") {
    return mealFrom([item(c.has("diabetes") || c.has("pcos") ? "B08" : "B07"), item("X10"), item(sabzi, 0.75)], 0, ONE_TWO);
  }
  if (inp.diet === "nonveg" && kind === 6) {
    const nv = pickUnused(NONVEG_CURRIES.filter((id) => allowed(D(id), inp)), r, used) || "N04";
    const st0 = staples(inp, "dinner")[0];
    return mealFrom([item(st0.id, 2), item(nv), item("X01", 0.5)], 0, st0.steps);
  }
  if (inp.diet === "eggetarian" && kind === 6) {
    const st1 = staples(inp, "dinner")[0];
    return mealFrom([item(st1.id, 2), item(EGG_CURRIES[0]), item("X01", 0.5)], 0, st1.steps);
  }
  if (inp.region === "south") {
    return mealFrom([item("B04"), item("L08"), item(sabzi, 0.75)], 0, ONE_TWO);
  }
  const st = staples(inp, "dinner");
  const s = st[Math.floor(r() * Math.min(st.length, 3))];
  const dal = pickUnused(["L03", "L04", "L01", "L10", "X10", "L02"].filter((id) => allowed(D(id), inp)), r, used) || "L03";
  return mealFrom([item(s.id, 2), item(sabzi), item(dal, 0.75)], 0, s.steps);
}

function pickUnused(ids: string[], r: () => number, used: Set<string>): string | null {
  if (!ids.length) return null;
  const fresh = ids.filter((id) => !used.has(id));
  const pool = fresh.length ? fresh : ids;
  const id = pool[Math.floor(r() * pool.length)];
  used.add(id);
  return id;
}

// ——— Calorie targets & slot shares ———
export function defaultTarget(goal: Goal): number {
  return goal === "lose" ? 1400 : goal === "gain" ? 2300 : 1800;
}

const SLOTS = [
  { slot: "early", label: "Early morning", time: "6:30 AM", share: 0.02 },
  { slot: "breakfast", label: "Breakfast", time: "8:30 AM", share: 0.22 },
  { slot: "midmorning", label: "Mid-morning", time: "11:00 AM", share: 0.07 },
  { slot: "lunch", label: "Lunch", time: "1:30 PM", share: 0.32 },
  { slot: "eveningsnack", label: "Evening snack", time: "5:00 PM", share: 0.1 },
  { slot: "dinner", label: "Dinner", time: "8:00 PM", share: 0.24 },
  { slot: "bedtime", label: "Bedtime", time: "10:00 PM", share: 0.05 },
];

function tipsFor(inp: PlanInput): string[] {
  const c = new Set(inp.conditions);
  const t: string[] = [];
  if (inp.goal === "lose" || c.has("weight")) t.push("Fill half your plate with sabzi and salad first; keep roti/rice to the portions shown.");
  if (inp.goal === "gain") t.push("Don't skip the mid-morning and bedtime snacks — they add steady calories without heavy meals.");
  if (c.has("diabetes")) t.push("Keep rice to the portion shown and pair every carb with dal, curd or sabzi. No sugar in tea.");
  if (c.has("pcos")) t.push("Eat every 3–4 hours and include protein (dal, paneer, curd, sprouts, eggs) in each meal.");
  if (c.has("thyroid")) t.push("Take your thyroid tablet on an empty stomach and have breakfast 30–45 minutes later.");
  if (c.has("cholesterol")) t.push("Limit ghee/oil to 3–4 teaspoons a day in total; prefer roasting, steaming and grilling.");
  if (c.has("digestive")) t.push("Eat slowly, keep spices mild and have curd or chaas with lunch.");
  if (c.has("oncology")) t.push("Appetite can change with treatment — smaller, frequent meals are fine. Follow your oncology team's advice first.");
  t.push("Drink 8–10 glasses of water across the day.");
  t.push("Use 1 tsp oil per katori of sabzi/dal — the calories shown assume this.");
  return t.slice(0, 5);
}

const GOAL_LABEL: Record<Goal, string> = { lose: "Weight loss", gain: "Weight gain", maintain: "Maintain weight", better: "Eat better" };
const COND_LABEL: Record<Condition, string> = { diabetes: "Diabetes", pcos: "PCOS", thyroid: "Thyroid", cholesterol: "Cholesterol", digestive: "Digestive health", oncology: "Cancer care", weight: "Weight management" };

export function generatePlan(input: PlanInput): GeneratedPlan {
  const inp: PlanInput = {
    ...input,
    conditions: (input.conditions || []).filter((c) => c in COND_LABEL),
    days: input.days === 1 ? 1 : 7,
  };
  const target = Math.min(3200, Math.max(1100, Math.round(inp.targetKcal || defaultTarget(inp.goal))));
  const r = rng(inp.seed ?? Math.floor(Math.random() * 1e9));
  const slots = SLOTS.filter((s) => s.slot !== "bedtime" || inp.goal === "gain" || inp.goal === "better" || inp.conditions.includes("oncology"));
  const shareSum = slots.reduce((s, x) => s + x.share, 0);

  const breakfasts = shuffle(breakfastOptions(inp), r);
  const mids = midMorningOptions(inp, r);
  const evenings = shuffle(eveningOptions(inp), r);
  const earlyIds = ["M13", "M14", "K16", "M10"].filter((id) => allowed(D(id), inp) && !(id === "M10" && sugarG(D(id)) > 0 && (inp.conditions.includes("diabetes") || inp.conditions.includes("pcos"))));
  const bedtime = ["M15", "K16", "F02", "M12"].find((id) => allowed(D(id), inp) && !(inp.diet === "vegan" && id === "M15")) || "M12";

  const used = new Set<string>();
  const days: PlanDay[] = [];
  for (let di = 0; di < (inp.days || 7); di++) {
    if (di % 4 === 0) used.clear(); // allow repeats only after a few days
    // 1) choose what to eat in each slot
    const drafts: { s: (typeof slots)[number]; draft: MealDraft; alt: string }[] = [];
    for (const s of slots) {
      let draft: MealDraft;
      let alt = "";
      if (s.slot === "early") {
        const id = earlyIds[di % earlyIds.length] || "M13";
        draft = mealFrom([item(id)], null, []);
        if (id !== "K16" && inp.goal === "gain" && allowed(D("K16"), inp)) draft = mealFrom([item(id), item("K16")], null, []);
      } else if (s.slot === "breakfast") {
        draft = breakfasts[di % breakfasts.length];
        alt = breakfasts[(di + 3) % breakfasts.length].parts[0].d.name;
      } else if (s.slot === "midmorning") {
        draft = mids[di % mids.length];
        alt = mids[(di + 2) % mids.length].parts[0].d.name;
      } else if (s.slot === "lunch") {
        draft = lunchFor(inp, r, di, used);
      } else if (s.slot === "eveningsnack") {
        draft = evenings[di % evenings.length];
        alt = evenings[(di + 2) % evenings.length].parts.map((p) => p.d.name).join(" + ");
      } else if (s.slot === "dinner") {
        draft = dinnerFor(inp, r, di, used);
      } else {
        draft = mealFrom(inp.goal === "gain" && allowed(D("K06"), inp) ? [item(bedtime), item("K06")] : [item(bedtime)], null, []);
      }
      if (inp.goal === "gain" && draft.scalable !== null && s.slot !== "dinner") {
        const mx = Math.max(...draft.steps);
        draft = { ...draft, steps: [...draft.steps, mx + (mx >= 2 ? 1 : 0.5)] };
      }
      drafts.push({ s, draft, alt });
    }

    // 2) size each meal; whatever one meal over/under-shoots is carried
    //    into the next so the day as a whole lands near the target
    let remaining = target;
    let sharesLeft = shareSum;
    const fitted: Pick[][] = [];
    for (const { s, draft } of drafts) {
      const slotTarget = (remaining * s.share) / sharesLeft;
      const parts = fitMeal(draft, slotTarget);
      fitted.push(parts);
      remaining -= sumMeal(parts).kcal;
      sharesLeft -= s.share;
    }

    // 3) still well short (fixed meals like fruit can't grow)? add a sensible extra
    const dayKcal = () => fitted.reduce((a, p) => a + sumMeal(p).kcal, 0);
    const fillers: [string, string][] = [["eveningsnack", "K04"], ["midmorning", "K16"], ["bedtime", "M03"], ["lunch", "M01"]];
    for (const [slot, id] of fillers) {
      if (dayKcal() >= target * 0.94) break;
      const i = drafts.findIndex((x) => x.s.slot === slot);
      if (i < 0 || !allowed(D(id), inp) || fitted[i].some((p) => p.d.id === "D" + id)) continue;
      const add = D(id);
      const q = Math.min(1, Math.max(0.5, Math.round(((target - dayKcal()) / add.kcal) * 2) / 2));
      fitted[i] = [...fitted[i], { d: add, q }];
    }
    // …or clearly over: trim the biggest scalable staple one step
    for (let guard = 0; guard < 3 && dayKcal() > target * 1.07; guard++) {
      let bestI = -1;
      for (let i = 0; i < drafts.length; i++) {
        const { draft } = drafts[i];
        if (draft.scalable === null) continue;
        const cur = fitted[i][draft.scalable]?.q;
        const lower = draft.steps.filter((x) => x < cur);
        if (lower.length && (bestI < 0 || sumMeal(fitted[i]).kcal > sumMeal(fitted[bestI]).kcal)) bestI = i;
      }
      if (bestI < 0) break;
      const dr = drafts[bestI].draft;
      const cur = fitted[bestI][dr.scalable!].q;
      const next = Math.max(...dr.steps.filter((x) => x < cur));
      fitted[bestI] = fitted[bestI].map((p, k) => (k === dr.scalable ? { ...p, q: next } : p));
    }

    const meals: PlanMeal[] = drafts.map(({ s, alt: alt0 }, i) => {
      const parts = fitted[i];
      const t = sumMeal(parts);
      const items = parts.map((p) => ({
        name: p.d.name,
        portion: scalePortion(p.d.serving, p.q),
        kcal: Math.round(p.d.kcal * p.q),
        protein: Math.round(p.d.protein * p.q * 10) / 10,
      }));
      let alt = alt0;
      if (s.slot === "lunch" || s.slot === "dinner") {
        const main = parts[1]?.d.name || "";
        alt = main ? `Swap ${main.toLowerCase()} with any dal or sabzi from another day` : "";
      }
      return {
        slot: s.slot,
        label: s.label,
        time: s.time,
        title: items.map((x) => x.name).join(" + "),
        items,
        kcal: Math.round(t.kcal),
        protein: Math.round(t.protein),
        carbs: Math.round(t.carbs),
        fat: Math.round(t.fat),
        fibre: Math.round(t.fibre),
        alt,
      };
    });
    const tot = meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat, fibre: a.fibre + m.fibre }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
    days.push({ day: di + 1, label: `Day ${di + 1}`, meals, ...tot });
  }

  const condText = inp.conditions.map((c) => COND_LABEL[c]).join(" + ");
  return {
    title: input.name || `${condText || GOAL_LABEL[inp.goal]} · ${target} kcal ${inp.days === 1 ? "1-day" : "7-day"} plan`,
    goal: inp.goal,
    diet: inp.diet,
    region: inp.region,
    conditions: inp.conditions,
    targetKcal: target,
    days,
    tips: tipsFor(inp),
    source: "Health365 plan generator · calories from USDA FoodData Central values",
    createdAt: new Date().toISOString(),
  };
}

// Sanitises untrusted input (admin form or app request).
export function parsePlanInput(b: Record<string, unknown> | null | undefined): PlanInput {
  const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
  const conds = Array.isArray(b?.conditions) ? (b!.conditions as unknown[]).map(String) : [];
  return {
    goal: pick(b?.goal, ["lose", "gain", "maintain", "better"] as const, "better"),
    diet: pick(b?.diet, ["veg", "eggetarian", "nonveg", "jain", "vegan"] as const, "veg"),
    region: pick(b?.region, ["gujarati", "north", "south", "mixed"] as const, "mixed"),
    conditions: conds.filter((c): c is Condition => c in COND_LABEL).slice(0, 4),
    targetKcal: Number(b?.targetKcal) || undefined,
    days: Number(b?.days) === 1 ? 1 : 7,
    seed: Number.isFinite(Number(b?.seed)) && b?.seed !== undefined && b?.seed !== "" ? Number(b?.seed) : undefined,
    name: typeof b?.name === "string" ? b.name.trim().slice(0, 80) : undefined,
    avoid: (Array.isArray(b?.avoid) ? (b!.avoid as unknown[]) : []).map((x) => String(x).toLowerCase()).filter((x) => x in AVOID_CODES).slice(0, 10),
  };
}
