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
  { key: "oncology", label: "Oncology / Cancer Care", group: "condition" },
];

// Shared specialization list for the dietitian directory filters, the
// "join as a dietitian" application form, and Dr. Astha's profile picker
// in admin — so all three always match.
export const SPECIALIZATIONS = [
  "Diabetes", "PCOS", "PCOD", "Thyroid", "Weight Management", "Weight Gain",
  "Obesity", "Cholesterol", "Hypertension", "Digestive Health", "IBS/IBD",
  "Constipation", "Ulcerative Colitis", "Kidney", "Pancreatitis", "Anemia",
  "Psoriasis", "Arthritis", "Pregnancy", "Depression", "Oncology", "Other",
];

// Maps the goal labels used on the diet-plan page's toggle group to a
// template key, for the 4 basic (non-disease) goals.
export const GOAL_TO_TEMPLATE_KEY: Record<string, string> = {
  "Lose weight": "lose-weight",
  "Gain weight": "gain-weight",
  "Maintain weight": "maintain-weight",
  "Improve nutrition": "improve-nutrition",
};
