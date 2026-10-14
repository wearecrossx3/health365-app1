import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";
import { isRateLimited } from "@/lib/kv";
import { getFoodDatabase } from "@/lib/foods";

// Food scanner for the app: a photo of a plate → the dishes on it, with portions
// and calories. The photo is sent to an AI vision model only to read it — it is
// never stored. Dishes we know are re-calculated from our own food database so
// the numbers match the calorie counter; anything else uses the model's estimate.
//
// Set ONE of these in Vercel → Settings → Environment Variables:
//   GEMINI_API_KEY      (Google AI Studio — has a free tier)   optional GEMINI_MODEL
//   ANTHROPIC_API_KEY   (Claude)                               optional CLAUDE_MODEL
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function OPTIONS() {
  return appPreflight();
}

interface ScanItem { name: string; matched?: string | null; servings?: number; portion?: string; kcal?: number; protein?: number; carbs?: number; fat?: number; confidence?: number }

function prompt(dishList: string) {
  return `You are a nutrition assistant for an Indian diet app. Look at the photo and list every food or drink item you can see.
For each item, estimate the portion actually on the plate.
If an item matches one of these dishes, use its exact name in "matched" and give "servings" as a multiple of that dish's serving (e.g. 2 rotis = 2, half a katori = 0.5):
${dishList}
If nothing in the list fits, set "matched": null and estimate kcal, protein, carbs and fat (grams) yourself for the portion shown.
Reply with JSON only, no other text, in exactly this shape:
{"items":[{"name":"","matched":null,"servings":1,"portion":"","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":0.8}],"note":""}
If there is no food in the photo, reply {"items":[],"note":"No food found"}.`;
}

function parseJson(text: string): { items: ScanItem[]; note?: string } | null {
  const t = text.replace(/```json|```/g, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try {
    const j = JSON.parse(t.slice(a, b + 1));
    return Array.isArray(j.items) ? j : null;
  } catch {
    return null;
  }
}

async function askGemini(key: string, image: string, p: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: p }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`gemini ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.candidates?.[0]?.content?.parts || []).map((x: { text?: string }) => x.text || "").join("");
}

async function askClaude(key: string, image: string, p: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } }, { type: "text", text: p }] }],
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`claude ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.content || []).map((x: { text?: string }) => x.text || "").join("");
}

const n = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round((Number(v) || 0) * 10) / 10));

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in to use the food scanner.", code: "auth" }, 401);
  const limited = await limit(req, "app-scan", 60, 3600);
  if (limited) return limited;
  if (await isRateLimited(`scan-user:${session.userId}`, 25, 86400)) {
    return appJson({ error: "You've used today's 25 scans. You can still add food by searching.", code: "limit" }, 429);
  }
  const gk = process.env.GEMINI_API_KEY, ck = process.env.ANTHROPIC_API_KEY;
  if (!gk && !ck) return appJson({ error: "The food scanner isn't switched on yet. Please add food by searching for now.", code: "off" }, 503);

  const b = await req.json().catch(() => null);
  const image = String(b?.image || "").replace(/^data:image\/\w+;base64,/, "");
  if (image.length < 1000) return appJson({ error: "No photo received." }, 400);
  if (image.length > 2_500_000) return appJson({ error: "That photo is too large." }, 413);

  const db = await getFoodDatabase(false);
  const dishes = db.dishes;
  const list = dishes.map((d) => `- ${d.name} (${d.serving})`).join("\n");
  let text = "";
  try {
    text = gk ? await askGemini(gk, image, prompt(list)) : await askClaude(ck!, image, prompt(list));
  } catch (e) {
    console.error("scan-food failed:", e);
    return appJson({ error: "Couldn't read the photo right now — please try again, or add food by searching." }, 502);
  }
  const j = parseJson(text);
  if (!j) return appJson({ error: "Couldn't read the photo — try a clearer, well-lit picture from above." }, 422);

  const byName = new Map(dishes.map((d) => [d.name.toLowerCase(), d]));
  const items = j.items.slice(0, 12).map((it) => {
    const dish = it.matched ? byName.get(String(it.matched).toLowerCase()) : undefined;
    const sv = Math.max(0.25, Math.min(10, Number(it.servings) || 1));
    if (dish) {
      return {
        id: dish.id, name: dish.name, portion: sv === 1 ? dish.serving : `${sv} × ${dish.serving}`, servings: sv, serving: dish.serving,
        kcal: Math.round(dish.kcal * sv), protein: n(dish.protein * sv, 300), carbs: n(dish.carbs * sv, 600), fat: n(dish.fat * sv, 300),
        source: "db", confidence: n(it.confidence, 1),
      };
    }
    return {
      id: "", name: String(it.name || "Food").slice(0, 60), portion: String(it.portion || "").slice(0, 40), servings: 1, serving: String(it.portion || "1 portion").slice(0, 40),
      kcal: Math.round(n(it.kcal, 3000)), protein: n(it.protein, 300), carbs: n(it.carbs, 600), fat: n(it.fat, 300),
      source: "ai", confidence: n(it.confidence, 1),
    };
  }).filter((x) => x.kcal > 0 || x.source === "db");
  return appJson({ ok: true, items, note: String(j.note || "").slice(0, 200) });
}
