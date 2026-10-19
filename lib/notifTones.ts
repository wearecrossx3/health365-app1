import { redis } from "./kv";

// Notification sounds for the Android app, picked by the owner in
// Admin → App Notifications. The app bundles these tones; this only stores
// which one plays for each type of notification.
export const TONE_TYPES = [
  { key: "meal", label: "Meal & weigh-in reminders" },
  { key: "water", label: "Water reminders" },
  { key: "activity", label: "Streaks & activity" },
  { key: "consult", label: "Consultations & dietitian" },
  { key: "offer", label: "Offers" },
  { key: "update", label: "News & updates" },
] as const;
export const TONES = [
  { key: "chime", label: "Chime" },
  { key: "droplet", label: "Droplet" },
  { key: "bell", label: "Bell" },
  { key: "sparkle", label: "Sparkle" },
  { key: "pop", label: "Pop" },
  { key: "marimba", label: "Marimba" },
  { key: "coin", label: "Coin" },
  { key: "harp", label: "Harp" },
  { key: "default", label: "Phone's default sound" },
] as const;
export const DEFAULT_TONES: Record<string, string> = { meal: "marimba", water: "droplet", activity: "sparkle", consult: "harp", offer: "coin", update: "chime" };

const KEY = "notif_tones";
export async function getNotifTones(): Promise<Record<string, string>> {
  let saved: Record<string, string> = {};
  try { saved = JSON.parse((await redis().get(KEY)) || "{}"); } catch { /* defaults */ }
  return { ...DEFAULT_TONES, ...saved };
}
export async function setNotifTones(input: Record<string, unknown>): Promise<Record<string, string>> {
  const ok = new Set<string>(TONES.map((t) => t.key));
  const out: Record<string, string> = {};
  for (const { key } of TONE_TYPES) {
    const v = String(input?.[key] ?? "");
    out[key] = ok.has(v) ? v : DEFAULT_TONES[key];
  }
  await redis().set(KEY, JSON.stringify(out));
  return out;
}
