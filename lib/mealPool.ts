export interface MealItem {
  name: string;
  portion: string;
  cal: string;
  alt: string;
  diets: string[];
  allergens: string[];
}

export const slotLabels: Record<string, string> = {
  breakfast: "Breakfast",
  midmorning: "Mid-morning",
  lunch: "Lunch",
  eveningsnack: "Evening snack",
  dinner: "Dinner",
};
export const slotOrder = ["breakfast", "midmorning", "lunch", "eveningsnack", "dinner"];

export const mealPool: Record<string, MealItem[]> = {
  breakfast: [
    { name: "Vegetable poha", portion: "1 bowl (~200g)", cal: "~250 kcal", alt: "Moong dal chilla", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Moong dal chilla", portion: "2 chillas", cal: "~220 kcal", alt: "Besan cheela", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Vegetable upma", portion: "1 bowl", cal: "~230 kcal", alt: "Idli with sambar", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: ["gluten"] },
    { name: "Idli with sambar", portion: "3 idlis + 1 bowl sambar", cal: "~240 kcal", alt: "Vegetable upma", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Besan cheela", portion: "2 cheelas", cal: "~210 kcal", alt: "Vegetable poha", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Masala oats", portion: "1 bowl", cal: "~220 kcal", alt: "Vegetable poha", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Paneer bhurji with roti", portion: "1 roti + paneer", cal: "~300 kcal", alt: "Tofu bhurji with roti", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy", "gluten"] },
    { name: "Tofu bhurji with roti", portion: "1 roti + tofu", cal: "~280 kcal", alt: "Paneer bhurji with roti", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: ["soy", "gluten"] },
    { name: "Boiled eggs with fruit", portion: "2 eggs + 1 fruit", cal: "~260 kcal", alt: "Egg bhurji with toast", diets: ["eggetarian", "nonveg"], allergens: ["eggs"] },
    { name: "Egg bhurji with toast", portion: "2 eggs + 2 toast", cal: "~320 kcal", alt: "Boiled eggs with fruit", diets: ["eggetarian", "nonveg"], allergens: ["eggs", "gluten"] },
  ],
  midmorning: [
    { name: "Seasonal fruit bowl", portion: "1 cup", cal: "~90 kcal", alt: "Roasted chana", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Coconut water", portion: "1 glass", cal: "~45 kcal", alt: "Buttermilk (chaas)", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Buttermilk (chaas)", portion: "1 glass", cal: "~60 kcal", alt: "Coconut water", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy"] },
    { name: "Handful of soaked almonds", portion: "8–10 almonds", cal: "~70 kcal", alt: "Roasted chana", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: ["nuts"] },
    { name: "Roasted chana", portion: "1 small bowl", cal: "~120 kcal", alt: "Sprouts salad", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Sprouts salad", portion: "1 small bowl", cal: "~100 kcal", alt: "Seasonal fruit bowl", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Herbal tea with 2 khakhra", portion: "1 cup + 2 khakhra", cal: "~90 kcal", alt: "Seasonal fruit bowl", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: ["gluten"] },
  ],
  lunch: [
    { name: "Dal, roti, sabzi, salad", portion: "1 bowl dal + 2 roti + sabzi", cal: "~450 kcal", alt: "Rajma chawal with salad", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["gluten"] },
    { name: "Rajma chawal with salad", portion: "1 bowl rajma + 1 cup rice", cal: "~430 kcal", alt: "Chole with rice", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Khichdi with kadhi", portion: "1 bowl khichdi + kadhi", cal: "~400 kcal", alt: "Vegetable pulao with raita", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy"] },
    { name: "Vegetable pulao with raita", portion: "1.5 cups pulao + raita", cal: "~420 kcal", alt: "Khichdi with kadhi", diets: ["veg", "jain", "eggetarian", "nonveg", "other"], allergens: ["dairy"] },
    { name: "Chole with rice", portion: "1 bowl chole + 1 cup rice", cal: "~440 kcal", alt: "Rajma chawal with salad", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Paneer sabzi with roti", portion: "1 bowl paneer sabzi + 2 roti", cal: "~470 kcal", alt: "Tofu sabzi with roti", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy", "gluten"] },
    { name: "Tofu sabzi with roti", portion: "1 bowl tofu sabzi + 2 roti", cal: "~440 kcal", alt: "Paneer sabzi with roti", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: ["soy", "gluten"] },
    { name: "Vegetable khichdi with papad", portion: "1.5 bowls", cal: "~380 kcal", alt: "Khichdi with kadhi", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Grilled fish curry with rice", portion: "100g fish + 1 cup rice", cal: "~430 kcal", alt: "Chicken curry with rice", diets: ["nonveg"], allergens: ["shellfish"] },
    { name: "Chicken curry with rice", portion: "100g chicken + 1 cup rice", cal: "~460 kcal", alt: "Grilled fish curry with rice", diets: ["nonveg"], allergens: [] },
  ],
  eveningsnack: [
    { name: "Roasted makhana", portion: "1 small bowl", cal: "~110 kcal", alt: "Sprouts chaat", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Sprouts chaat", portion: "1 bowl", cal: "~130 kcal", alt: "Fruit chaat", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Fruit chaat", portion: "1 bowl", cal: "~100 kcal", alt: "Roasted makhana", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Green tea with 2 khakhra", portion: "1 cup + 2 khakhra", cal: "~120 kcal", alt: "Roasted makhana", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: ["gluten"] },
    { name: "Vegetable soup", portion: "1 bowl", cal: "~90 kcal", alt: "Sprouts chaat", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Hung curd with honey", portion: "1 small bowl", cal: "~140 kcal", alt: "Fruit chaat", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy"] },
  ],
  dinner: [
    { name: "Vegetable khichdi", portion: "1.5 bowls", cal: "~360 kcal", alt: "Moong dal with roti and sabzi", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Moong dal with roti and sabzi", portion: "1 bowl dal + 2 roti", cal: "~380 kcal", alt: "Mixed vegetable curry with rice", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["gluten"] },
    { name: "Mixed vegetable curry with rice", portion: "1 bowl + 1 cup rice", cal: "~350 kcal", alt: "Vegetable khichdi", diets: ["veg", "jain", "vegan", "eggetarian", "nonveg", "other"], allergens: [] },
    { name: "Palak paneer with roti", portion: "1 bowl + 2 roti", cal: "~400 kcal", alt: "Palak tofu with roti", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy", "gluten"] },
    { name: "Palak tofu with roti", portion: "1 bowl + 2 roti", cal: "~380 kcal", alt: "Palak paneer with roti", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: ["soy", "gluten"] },
    { name: "Grilled paneer salad", portion: "1 large bowl", cal: "~320 kcal", alt: "Grilled tofu salad", diets: ["veg", "eggetarian", "nonveg", "other"], allergens: ["dairy"] },
    { name: "Grilled tofu salad", portion: "1 large bowl", cal: "~300 kcal", alt: "Grilled paneer salad", diets: ["veg", "vegan", "eggetarian", "nonveg", "other"], allergens: ["soy"] },
    { name: "Light chicken soup with vegetables", portion: "1 bowl", cal: "~250 kcal", alt: "Vegetable khichdi", diets: ["nonveg"], allergens: [] },
  ],
};

export function pickMeal(diet: string, avoid: string[], slot: string, dayIndex: number, offset: number): MealItem | null {
  const candidates = mealPool[slot].filter(
    (item) => item.diets.includes(diet) && !item.allergens.some((a) => avoid.includes(a))
  );
  if (candidates.length === 0) return null;
  return candidates[(dayIndex + offset) % candidates.length];
}
