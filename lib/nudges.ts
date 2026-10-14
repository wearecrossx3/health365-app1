import { getJSON, setJSON } from "./kv";

// "Random nudges" — short, playful reminders the Android app shows at random
// times of day (the way food-delivery apps do). The pool is edited in
// Admin → App Notifications; the app downloads it with /api/app/bootstrap and
// schedules them ON THE PHONE inside the time window below, so nothing has to
// be sent from the server and it works even when the phone is offline.

export interface Nudge {
  id: string;
  title: string;
  body: string;
  audience: string; // "all" | "account" | "guest" | condition key
  enabled: boolean;
}

export interface NudgeSettings {
  enabled: boolean;
  perDay: number; // 1–3
  fromHour: number; // 0–23, IST local phone time
  toHour: number; // 1–23
  quietDays: number[]; // 0=Sun … 6=Sat, days with no nudges
  nudges: Nudge[];
  updatedAt: string;
}

const KEY = "app_nudges";

const n = (id: string, title: string, body: string, audience = "all"): Nudge => ({ id, title, body, audience, enabled: true });

export const DEFAULT_NUDGES: NudgeSettings = {
  enabled: true,
  perDay: 2,
  fromHour: 9,
  toHour: 21,
  quietDays: [],
  updatedAt: "",
  nudges: [
    n("n01", "Paani pi lo 💧", "Your water glass is feeling lonely. Two sips now?"),
    n("n02", "Chai break? ☕", "Go easy on the sugar today — your future self says thanks."),
    n("n03", "Roti count check 🫓", "Two rotis + a big katori of sabzi beats four rotis + a spoon of sabzi."),
    n("n04", "Lunch plan ready 🍱", "Your thali is waiting in the app. Tap to see today's lunch."),
    n("n05", "10-minute walk? 🚶", "A short walk after dinner keeps sugar spikes calmer. Shoes on?"),
    n("n06", "Snack attack incoming 🥨", "Roasted chana > namkeen. Same crunch, more protein."),
    n("n07", "Did you tick breakfast? ✅", "Mark your meals — streaks are more fun than you think."),
    n("n08", "Salad first, then the rest 🥗", "Starting lunch with salad makes it easier to eat right."),
    n("n09", "Haldi doodh tonight? 🌙", "A warm, light end to the day helps you sleep better."),
    n("n10", "Fruit > juice 🍊", "Whole fruit keeps the fibre. Juice keeps only the sugar."),
    n("n11", "Thoda protein add karo 💪", "Dal, paneer, curd, sprouts or eggs — one in every meal."),
    n("n12", "Weekend chhe? 🎉", "Enjoy it — just keep one meal light and one walk long."),
    n("n13", "Ghee ka hisaab 🧈", "One teaspoon is ~45 kcal. Use it, just measure it."),
    n("n14", "Bas 1 glass aur 💧", "You're closer to your water goal than you think."),
    n("n15", "Dinner before 8? 🍽️", "An early, light dinner = lighter mornings."),
    n("n16", "Millet day! 🌾", "Bajra, jowar or ragi rotla today? Your gut will love the fibre."),
    n("n17", "Sweet craving? 🍯", "Try 2 dates or a small piece of jaggery instead of mithai."),
    n("n18", "Check today's plan 📋", "Your Health365 plan for today is one tap away."),
    n("n19", "Sugar levels calm rakho", "Pair carbs with protein — rice with dal, roti with sabzi.", "diabetes"),
    n("n20", "PCOS tip 🌸", "Steady meals every 3–4 hours help keep energy and cravings even.", "pcos"),
    n("n21", "Thyroid tip 🦋", "Take your tablet first, breakfast 30–45 minutes later.", "thyroid"),
    n("n22", "Heart-smart swap ❤️", "Grill, roast or steam today instead of deep-frying.", "cholesterol"),
    n("n23", "Gut feeling 🌿", "Curd or chaas with lunch keeps digestion happy.", "digestive"),
    n("n24", "Talk to a dietitian 👩‍⚕️", "Questions about your plan? Book a 1:1 consultation in the app.", "account"),
    n("n25", "Make it yours ✨", "Create a free account to save your plan and progress.", "guest"),
  ],
};

export async function getNudges(): Promise<NudgeSettings> {
  const s = await getJSON<Partial<NudgeSettings>>(KEY);
  if (!s) return DEFAULT_NUDGES;
  return { ...DEFAULT_NUDGES, ...s, nudges: Array.isArray(s.nudges) ? s.nudges : DEFAULT_NUDGES.nudges };
}

export async function saveNudges(s: NudgeSettings): Promise<void> {
  await setJSON(KEY, s);
}
