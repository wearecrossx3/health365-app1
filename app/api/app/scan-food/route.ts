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
export const maxDuration = 60;

export async function OPTIONS() {
  return appPreflight();
}

interface ScanItem { name: string; matched?: string | null; servings?: number; portion?: string; kcal?: number; protein?: number; carbs?: number; fat?: number; confidence?: number }

function prompt(dishList: string) {
  return `You are a nutrition assistant for an Indian diet app. Look at the photo and list every food or drink you can see.
It can be a home-cooked plate or thali, a restaurant dish, a drink (chai, coffee, juice, milkshake, soft drink),
fruit, or a packaged product (chips/wafers, namkeen, biscuits, chocolate bars like Munchies, instant noodles, etc.).
For each item estimate the amount actually shown (number of rotis, katoris, cups, pieces, or the pack size).
- If an item matches one of these dishes, put its exact name in "matched" and give "servings" as a multiple of that dish's serving (2 rotis = 2, half a katori = 0.5):
${dishList}
- Otherwise set "matched": null and estimate kcal, protein, carbs and fat (grams) for the amount shown.
- For packaged products, use the brand and product name you can read (e.g. "Lay's Classic Salted 52 g"); if the nutrition label is readable, use its numbers for the pack.
- For tea/coffee, assume milk and 1 tsp sugar unless it clearly looks black.
Reply with JSON only, no other text, exactly in this shape:
{"items":[{"name":"","matched":null,"servings":1,"portion":"","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":0.8}],"note":""}
If there is no food or drink in the photo, reply {"items":[],"note":"No food found"}.`;
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

// Gemini model names change often, so we ask Google which models this key can
// use (cached for an hour) and pick the configured one if it exists, otherwise
// the best available Flash model. "Thinking" is switched off where allowed —
// it adds seconds and doesn't help with reading a plate.
let modelCache: { at: number; names: string[] } | null = null;

async function availableModels(key: string): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 3600_000) return modelCache.names;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`);
    const d = await r.json().catch(() => ({}));
    const names: string[] = (d.models || [])
      .filter((m: { name?: string; supportedGenerationMethods?: string[] }) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""));
    if (names.length) modelCache = { at: Date.now(), names };
    return names;
  } catch {
    return [];
  }
}

function pickModels(names: string[]): string[] {
  const want = (process.env.GEMINI_MODEL || "").trim();
  const ok = (n: string) => /flash/.test(n) && !/image|tts|audio|live|embed|native|thinking-exp|computer/.test(n);
  const ver = (n: string) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");
  const stable = names.filter((n) => ok(n) && !/preview|exp/.test(n)).sort((a, b) => ver(b) - ver(a) || (/lite/.test(a) ? 1 : -1));
  const preview = names.filter((n) => ok(n) && /preview/.test(n)).sort((a, b) => ver(b) - ver(a));
  const out = [
    ...(want && (!names.length || names.includes(want)) ? [want] : []),
    ...["gemini-flash-latest", "gemini-flash-lite-latest"].filter((n) => !names.length || names.includes(n)),
    ...stable.slice(0, 3),
    ...preview.slice(0, 1),
    ...(names.length ? [] : ["gemini-2.5-flash"]),
  ];
  return out.filter((m, i, a) => a.indexOf(m) === i).slice(0, 4);
}

async function askGemini(key: string, image: string, p: string, signal: AbortSignal): Promise<string> {
  const models = pickModels(await availableModels(key));
  let last = "";
  for (const model of models) {
    for (const fast of [true, false]) {
      const generationConfig: Record<string, unknown> = { temperature: 0.2, responseMimeType: "application/json" };
      if (fast) generationConfig.thinkingConfig = { thinkingBudget: 0 };
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: p }] }], generationConfig }),
        signal,
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        const text = (d.candidates?.[0]?.content?.parts || []).filter((x: { thought?: boolean }) => !x.thought).map((x: { text?: string }) => x.text || "").join("");
        if (text) return text;
        last = `${model}: empty answer (${d.candidates?.[0]?.finishReason || d.promptFeedback?.blockReason || "no text"})`;
        break;
      }
      last = `${model} ${r.status}: ${String(d.error?.message || "").slice(0, 160)}`;
      console.error("scan-food:", last);
      if (r.status === 429) throw new Error("quota " + last);
      if (r.status === 400 && fast) continue; // model doesn't accept the thinking setting — retry without it
      if (r.status === 400 && /API key/i.test(last)) throw new Error("key " + last);
      if (r.status === 403) throw new Error("key " + last);
      break; // 404 / other → next model
    }
  }
  throw new Error(last || "no Gemini model available for this key");
}

async function askClaude(key: string, image: string, p: string, signal: AbortSignal): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } }, { type: "text", text: p }] }],
    }),
    signal,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`claude ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.content || []).map((x: { text?: string }) => x.text || "").join("");
}

const n = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round((Number(v) || 0) * 10) / 10));

export async function POST(req: NextRequest) {
  try {
    return await scan(req);
  } catch (e) {
    console.error("scan-food crashed:", e);
    return appJson({ error: "Couldn't read the photo right now — please try again, or add food by searching." }, 500);
  }
}

async function scan(req: NextRequest) {
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
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 45000);
  try {
    text = gk ? await askGemini(gk, image, prompt(list), ctl.signal) : await askClaude(ck!, image, prompt(list), ctl.signal);
  } catch (e) {
    console.error("scan-food failed:", e);
    const msg = String(e);
    if (ctl.signal.aborted) return appJson({ error: "The scanner took too long — please try again.", code: "slow" }, 504);
    const detail = msg.replace(/^Error:\s*/, "").replace(/key=[^&\s]+/g, "key=…").slice(0, 200);
    if (msg.startsWith("Error: quota")) return appJson({ error: "The scanner is busy right now — please try again in a minute.", code: "slow", detail }, 503);
    return appJson({ error: "Couldn't read the photo right now — please try again, or add food by searching.", detail }, 502);
  } finally {
    clearTimeout(timer);
  }
  const j = parseJson(text);
  if (!j) return appJson({ error: "Couldn't read the photo — try a clearer, well-lit picture from above.", detail: "unreadable answer: " + text.slice(0, 120) }, 422);

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
