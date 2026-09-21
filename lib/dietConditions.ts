// The fixed set of goals/conditions an admin can write a basic diet
// template for. Keeping this in one shared file means the admin editor
// and the public diet-plan page always agree on the same keys.

export interface DietTemplateOption {
  key: string;
  label: string;
  group: "goal" | "condition";
}

export const DIET_TEMPLATE_OPTIONS: DietTemplateOption[] = [
  { key: "lose-weight", label: "Lose Weight", group: "goal" },
  { key: "gain-weight", label: "Gain Weight", group: "goal" },
  { key: "maintain-weight", label: "Maintain Weight", group: "goal" },
  { key: "improve-nutrition", label: "Improve Nutrition", group: "goal" },
  { key: "diabetes", label: "Diabetes", group: "condition" },
  { key: "pcos", label: "PCOS", group: "condition" },
  { key: "thyroid", label: "Thyroid", group: "condition" },
  { key: "weight-management", label: "Weight Management", group: "condition" },
  { key: "cholesterol", label: "Cholesterol", group: "condition" },
  { key: "digestive-health", label: "Digestive Health", group: "condition" },
];

// Maps the goal labels used on the diet-plan page's toggle group to a
// template key, for the 4 basic (non-disease) goals.
export const GOAL_TO_TEMPLATE_KEY: Record<string, string> = {
  "Lose weight": "lose-weight",
  "Gain weight": "gain-weight",
  "Maintain weight": "maintain-weight",
  "Improve nutrition": "improve-nutrition",
};
