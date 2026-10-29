import crypto from "crypto";
import { getJSON, setJSON, redis } from "./kv";
import type { Appointment } from "./kv";
import { addNotice } from "./dietitianNotices";

// Client ratings for a consultation (1–5 stars + optional comment).
// The rating link carries an HMAC so only the client we sent it to can rate.
export interface Rating { apptId: string; dietitianId: string; stars: number; comment: string; client: string; at: string }

const secret = () => process.env.SESSION_SECRET || "health365";
export const rateToken = (apptId: string) => crypto.createHmac("sha256", secret()).update(`rate:${apptId}`).digest("hex").slice(0, 24);
export const rateTokenOk = (apptId: string, t: string) => {
  const a = Buffer.from(rateToken(apptId)), b = Buffer.from(String(t || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Public links always use the real domain (the env may still point at *.vercel.app).
export const siteUrl = () => {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return env && !/vercel\.app/i.test(env) ? env : "https://www.thehealth365.in";
};
export const rateLink = (apptId: string) => `${siteUrl()}/rate/${apptId}?t=${rateToken(apptId)}`;

// The chat message asking for a rating. Links can't be tapped in the app's
// chat, so the client can simply reply with a number.
export const rateAskText = (dietitianName: string, apptId: string) =>
  `⭐ How was your consultation with ${dietitianName}? Just reply here with a number from 1 to 5 (5 = excellent). You can add a few words too, e.g. "5 very helpful". Or rate on the website: ${rateLink(apptId)}`;

// "5", "4 stars", "5 ⭐ very helpful", "3/5 ok" → { stars, comment }
export function parseChatRating(text: string): { stars: number; comment: string } | null {
  const m = String(text || "").trim().match(/^([1-5])(?:\s*(?:\/\s*5|stars?|⭐+|★+))?(?:[\s,.:;!-]+([\s\S]*))?$/i);
  if (!m) return null;
  return { stars: Number(m[1]), comment: (m[2] || "").replace(/\s+/g, " ").trim().slice(0, 600) };
}

export async function wasAsked(apptId: string): Promise<boolean> {
  return !!(await redis().get(`rating_asked:${apptId}`));
}

const one = (apptId: string) => `rating:${apptId}`;
const list = (dietitianId: string) => `dt_ratings:${dietitianId}`;

export const getRating = (apptId: string) => getJSON<Rating>(one(apptId));

export async function saveRating(r: Rating): Promise<void> {
  const had = await getRating(r.apptId);
  await setJSON(one(r.apptId), r);
  const all = (await getJSON<Rating[]>(list(r.dietitianId))) || [];
  const next = had ? all.map((x) => (x.apptId === r.apptId ? r : x)) : [r, ...all];
  await setJSON(list(r.dietitianId), next.slice(0, 300));
}

export async function ratingsFor(dietitianId: string): Promise<{ avg: number; count: number; recent: Rating[] }> {
  const all = (await getJSON<Rating[]>(list(dietitianId))) || [];
  const count = all.length;
  const avg = count ? Math.round((all.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : 0;
  return { avg, count, recent: all.slice(0, 10) };
}

// Remember that we asked (so the daily job asks only once per consultation).
export async function markAsked(apptId: string): Promise<boolean> {
  return (await redis().set(`rating_asked:${apptId}`, "1", "EX", 60 * 60 * 24 * 120, "NX")) === "OK";
}

// Save a rating and, the first time, thank the client and tell the dietitian.
export async function recordRating(a: Appointment, stars: number, comment: string, client: string): Promise<void> {
  const { addMessage } = await import("./consultChat");
  const first = !(await getRating(a.id));
  await saveRating({ apptId: a.id, dietitianId: a.dietitianId, stars, comment, client, at: new Date().toISOString() });
  if (first) {
    await addMessage(a.id, "team", `⭐ Thank you for rating your consultation ${"★".repeat(stars)}${"☆".repeat(5 - stars)}`).catch(() => {});
    await addNotice(a.dietitianId, { title: `New rating: ${"★".repeat(stars)}`, body: `${client} rated your consultation ${stars}/5${comment ? `: “${comment}”` : "."}` }).catch(() => {});
  }
}
