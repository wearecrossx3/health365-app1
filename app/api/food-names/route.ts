import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminGuard";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { getFoodDatabase } from "@/lib/foods";
import { redis } from "@/lib/kv";
import { askAIText, aiAvailable } from "@/lib/aiText";
import { freeTranslate } from "@/lib/freeTranslate";

// Food names (and serving words) in the client's language, for the plan
// builder: type in English, pick the Gujarati / Hindi name. Translated once
// per language and food-list version, then kept.
export const maxDuration = 60;

const LANGS: Record<string, [string, string, boolean]> = {
  gu: ["Gujarati (Gujarati script)", "gu", false], hi: ["Hindi (Devanagari script)", "hi", false], mr: ["Marathi (Devanagari script)", "mr", false],
  bn: ["Bengali", "bn", false], pa: ["Punjabi (Gurmukhi script)", "pa", false], ta: ["Tamil", "ta", false], te: ["Telugu", "te", false],
  kn: ["Kannada", "kn", false], ml: ["Malayalam", "ml", false], ur: ["Urdu", "ur", false],
  hinglish: ["Hinglish (Hindi words in English letters)", "hi", true], gujlish: ["Gujarati written in English letters", "gu", true],
};

async function translate(strings: string[], lang: string): Promise<string[]> {
  const [label, tl, roman] = LANGS[lang];
  if (aiAvailable()) {
    try {
      const out: string[] = [];
      for (let s = 0; s < strings.length; s += 200) {
        const chunk = strings.slice(s, s + 200);
        const text = await askAIText(`Translate these Indian food names and serving words into ${label}, the way families say them at home (e.g. Roti, Dal, Chaas, Poha, katori, glass in local words). Keep numbers. Short, no explanations. Return ONLY JSON {"t":[...]} with exactly ${chunk.length} strings in the same order.\n${JSON.stringify(chunk)}`, { json: true, maxTokens: 8000, timeoutMs: 25000 });
        const m = text.match(/\{[\s\S]*\}/);
        const arr = m ? (JSON.parse(m[0]).t as unknown[]) : null;
        if (!Array.isArray(arr) || arr.length !== chunk.length) throw new Error("bad answer");
        out.push(...arr.map((x, i) => String(x || chunk[i]).slice(0, 120)));
      }
      return out;
    } catch { /* fall back to Google Translate */ }
  }
  return (await freeTranslate(strings, tl, { roman })).map((x, i) => String(x || strings[i]).slice(0, 120));
}

export async function GET(req: NextRequest) {
  const ok = (await adminFromRequest(req, "users")) || (await dietitianFromRequest(req));
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const lang = String(req.nextUrl.searchParams.get("lang") || "");
  if (!LANGS[lang]) return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  const db = await getFoodDatabase(false);
  const rows = [...db.dishes, ...db.foods];
  const key = `food_names:${lang}:${db.version}:${rows.length}`;
  const cached = await redis().get(key).catch(() => null);
  if (cached) return NextResponse.json(JSON.parse(cached));
  // Strip the English hints in brackets ("Sesame (til)" → "Sesame") so the translation is clean.
  const names = rows.map((f) => f.name);
  const servings = [...new Set(rows.map((f) => f.serving || "").filter(Boolean))];
  try {
    const tr = await translate([...names, ...servings], lang);
    const out = {
      names: Object.fromEntries(rows.map((f, i) => [f.id, tr[i]])),
      servings: Object.fromEntries(servings.map((s, i) => [s, tr[names.length + i]])),
    };
    await redis().set(key, JSON.stringify(out), "EX", 60 * 60 * 24 * 90).catch(() => {});
    return NextResponse.json(out);
  } catch (e) {
    console.error("food-names failed", e);
    return NextResponse.json({ error: "Couldn't load the names right now." }, { status: 502 });
  }
}
