import crypto from "crypto";
import { getJSON, setJSON, redis } from "./kv";

// Client ratings for a consultation (1–5 stars + optional comment).
// The rating link carries an HMAC so only the client we sent it to can rate.
export interface Rating { apptId: string; dietitianId: string; stars: number; comment: string; client: string; at: string }

const secret = () => process.env.SESSION_SECRET || "health365";
export const rateToken = (apptId: string) => crypto.createHmac("sha256", secret()).update(`rate:${apptId}`).digest("hex").slice(0, 24);
export const rateTokenOk = (apptId: string, t: string) => {
  const a = Buffer.from(rateToken(apptId)), b = Buffer.from(String(t || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
export const rateLink = (apptId: string) => `${(process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in").replace(/\/$/, "")}/rate/${apptId}?t=${rateToken(apptId)}`;

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
