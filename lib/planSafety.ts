// Gentle safety checks for the plan builder: flags foods that usually don't
// suit a client's condition or that contain something they're allergic to.
// These are reminders for the dietitian, not rules — nothing is blocked.

type Rule = { when: RegExp; label: string; foods: RegExp; why: string };

const SWEET = /\b(sugar|sweet|mithai|jalebi|gulab|halwa|ladoo|laddu|kheer|barfi|burfi|peda|rasgulla|rasmalai|shrikhand|basundi|sugarcane|jaggery|\bgur\b|honey|madh|cold drink|soft drink|cola|ice ?cream|cake|pastry|biscuit|chocolate|jam|sharbat|sherbet|mango shake|sweet lassi|chikki|gajar halwa|malpua|ghevar|mohanthal)\b/i;
const FRIED = /\b(fried|puri|poori|bhatura|bhajiya|bhaji|pakora|pakoda|samosa|kachori|vada|wada|fafda|gathiya|chakri|namkeen|farsan|chips|french fries|jalebi)\b/i;
const SALTY = /\b(pickle|achar|papad|namkeen|chips|farsan|salted|khakhra masala|instant noodles|maggi|sauce|ketchup|soy sauce)\b/i;
const HEAVY_FAT = /\b(ghee|butter|cream|malai|cheese|mayonnaise|vanaspati|dalda)\b/i;
const HIGH_K = /\b(banana|coconut water|potato|aloo|sweet potato|shakarkand|orange|santra|tomato soup|dry fruit|dates|khajur|raisin|kishmish|spinach|palak)\b/i;
const HIGH_GI = /\b(white bread|maida|cornflakes|instant oats|poha with sugar|sugarcane|watermelon|chikoo|sapota|mango|keri|grapes|draksh)\b/i;

const RULES: Rule[] = [
  { when: /diabet|sugar|prediabet/i, label: "Diabetes", foods: SWEET, why: "sweet / added sugar" },
  { when: /diabet|prediabet/i, label: "Diabetes", foods: HIGH_GI, why: "raises blood sugar fast" },
  { when: /pcos|pcod/i, label: "PCOS", foods: SWEET, why: "sweet / added sugar" },
  { when: /pcos|pcod/i, label: "PCOS", foods: FRIED, why: "deep-fried" },
  { when: /cholest|heart|cardiac|lipid|triglycer/i, label: "Cholesterol / heart", foods: FRIED, why: "deep-fried" },
  { when: /cholest|heart|cardiac|lipid|triglycer/i, label: "Cholesterol / heart", foods: HEAVY_FAT, why: "high in saturated fat" },
  { when: /hypertens|blood pressure|\bbp\b/i, label: "High BP", foods: SALTY, why: "high in salt" },
  { when: /kidney|renal|ckd/i, label: "Kidney", foods: HIGH_K, why: "high in potassium — check the client's reports" },
  { when: /kidney|renal|ckd/i, label: "Kidney", foods: SALTY, why: "high in salt" },
  { when: /weight|obes/i, label: "Weight", foods: FRIED, why: "deep-fried" },
  { when: /fatty liver|liver/i, label: "Fatty liver", foods: SWEET, why: "sweet / added sugar" },
  { when: /fatty liver|liver/i, label: "Fatty liver", foods: FRIED, why: "deep-fried" },
  { when: /acidity|gerd|reflux|ulcer|gastrit/i, label: "Acidity", foods: /\b(chilli|mirchi|pickle|achar|fried|samosa|tea|coffee|tomato|citrus|lemon|nimbu)\b/i, why: "can trigger acidity" },
  { when: /gout|uric/i, label: "Gout / uric acid", foods: /\b(rajma|chole|chana|urad|mutton|organ|liver|prawn|shrimp|sardine|beer)\b/i, why: "high in purines" },
  { when: /celiac|coeliac|gluten/i, label: "Gluten-free", foods: /\b(wheat|atta|roti|chapati|phulka|paratha|thepla|puri|naan|bread|daliya|dalia|suji|sooji|rava|upma|maida|barley|jau)\b/i, why: "contains gluten" },
  { when: /lactose/i, label: "Lactose intolerance", foods: /\b(milk|doodh|paneer|curd|dahi|chaas|buttermilk|lassi|kheer|shrikhand|cheese|ice ?cream|raita)\b/i, why: "contains milk" },
];

// Allergy words the client may write, and food words that contain them.
const ALLERGENS: [RegExp, RegExp, string][] = [
  [/peanut|groundnut|singdana|moongfali/i, /\b(peanut|groundnut|singdana|sing\b|moongfali|chikki)\b/i, "peanut"],
  [/milk|dairy|lactose/i, /\b(milk|doodh|paneer|curd|dahi|chaas|buttermilk|lassi|ghee|butter|cheese|kheer|shrikhand|raita|malai|cream)\b/i, "milk / dairy"],
  [/gluten|wheat/i, /\b(wheat|atta|roti|chapati|phulka|paratha|thepla|puri|naan|bread|daliya|dalia|suji|sooji|rava|upma|maida)\b/i, "wheat / gluten"],
  [/\begg/i, /\b(egg|anda|omelette|omelet|bhurji)\b/i, "egg"],
  [/nut|almond|cashew|walnut|badam|kaju|akhrot/i, /\b(almond|badam|cashew|kaju|walnut|akhrot|pista|pistachio|dry fruit|nuts?)\b/i, "tree nuts"],
  [/soy|soya/i, /\b(soy|soya|tofu)\b/i, "soy"],
  [/fish|seafood|prawn|shrimp/i, /\b(fish|machhi|prawn|shrimp|seafood|crab)\b/i, "fish / seafood"],
  [/sesame|til\b/i, /\b(sesame|til\b|tahini|chikki)\b/i, "sesame"],
  [/mushroom/i, /\bmushroom/i, "mushroom"],
];

export interface FoodWarning { text: string }

export function warningsFor(foodName: string, conditions: string[] = [], allergens: string[] = []): FoodWarning[] {
  // "Tea, no sugar" / "sugar-free" shouldn't trip the sugar check.
  const name = String(foodName || "")
    .replace(/\b(no|without|less|low|zero)[\s-]+(added\s+)?(sugar|salt|oil|ghee)\b/gi, " ")
    .replace(/\b(sugar|salt|oil)[\s-]*(free|less)\b/gi, " ")
    .replace(/\bunsweetened\b/gi, " ");
  if (!name.trim()) return [];
  const out: string[] = [];
  const cond = conditions.join(" | ");
  for (const r of RULES) {
    if (r.when.test(cond) && r.foods.test(name)) out.push(`${r.label}: ${r.why}`);
  }
  const allergy = allergens.join(" | ");
  for (const [said, food, label] of ALLERGENS) {
    if (said.test(allergy) && food.test(name)) out.push(`Allergy: has ${label}`);
  }
  return [...new Set(out)].map((text) => ({ text }));
}
