import foodDb from "./data/health365-foods.json";
import { getJSON, setJSON } from "./kv";

// Calorie-counter food database (openly licensed data only):
//  • ingredients per 100 g from USDA FoodData Central, SR Legacy (U.S. public
//    domain; taken from the TempoLife Food Nutrition Dataset, CC-BY-4.0) — a few
//    Indian staples USDA doesn't list use typical values (marked as such);
//  • ~130 everyday Indian dishes with a household serving, worked out from
//    those values using standard home recipes.
// Admin → Food Database can correct a value, hide an item, or add a custom
// food; those changes are stored in Redis and merged on top of the file.

export interface FoodItem {
  id: string;
  name: string;
  aliases?: string;
  group: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fibre: number;
  per: string; // "100g" or "serving"
  serving?: string; // for dishes, e.g. "1 katori"
  servingG?: number;
  sci?: string;
  src: string;
  custom?: boolean;
}

export interface FoodOverrides {
  edited: Record<string, Partial<FoodItem>>;
  hidden: string[];
  added: FoodItem[];
  updatedAt: string;
}

const KEY = "food_overrides";
const EMPTY: FoodOverrides = { edited: {}, hidden: [], added: [], updatedAt: "" };

type Db = { version: string; source: string; foods: FoodItem[]; dishes: FoodItem[] };
const DB = foodDb as unknown as Db;

export async function getFoodOverrides(): Promise<FoodOverrides> {
  return { ...EMPTY, ...((await getJSON<FoodOverrides>(KEY)) || {}) };
}

export async function saveFoodOverrides(o: FoodOverrides): Promise<void> {
  await setJSON(KEY, { ...o, updatedAt: new Date().toISOString() });
}

const strip = (f: FoodItem & { recipe?: unknown; note?: unknown }): FoodItem => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { recipe, note, ...rest } = f;
  return rest;
};

// Base + admin changes. `includeHidden` is for the admin editor only.
export async function getFoodDatabase(includeHidden = false) {
  const o = await getFoodOverrides();
  const hidden = new Set(o.hidden);
  const apply = (f: FoodItem) => ({ ...strip(f), ...(o.edited[f.id] || {}) });
  const keep = (f: FoodItem) => includeHidden || !hidden.has(f.id);
  return {
    version: `${DB.version}-${o.updatedAt || "0"}`,
    source: DB.source,
    dishes: [...o.added.filter((f) => f.per === "serving"), ...DB.dishes.map(apply)].filter(keep),
    foods: [...o.added.filter((f) => f.per !== "serving"), ...DB.foods.map(apply)].filter(keep),
    hidden: includeHidden ? o.hidden : undefined,
  };
}
