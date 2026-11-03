import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { appJson, appPreflight, limit } from "@/lib/appApi";
import { redis } from "@/lib/kv";
import { askAIText, aiAvailable } from "@/lib/aiText";
import { freeTranslate } from "@/lib/freeTranslate";

// The app's "Plan language" switch: the user's diet plan text (food names,
// portions, notes, tips) in Gujarati, Hindi… Numbers never change.
// Every string is translated once per language and kept for everyone, so
// most switches are instant and cost nothing.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const LANGS: Record<string, [string, string, boolean]> = {
  gu: ["Gujarati (Gujarati script)", "gu", false], hi: ["Hindi (Devanagari script)", "hi", false], mr: ["Marathi (Devanagari script)", "mr", false],
  bn: ["Bengali (Bengali script)", "bn", false], pa: ["Punjabi (Gurmukhi script)", "pa", false], ta: ["Tamil (Tamil script)", "ta", false],
  te: ["Telugu (Telugu script)", "te", false], kn: ["Kannada (Kannada script)", "kn", false], ml: ["Malayalam (Malayalam script)", "ml", false],
  ur: ["Urdu (Urdu script)", "ur", false], hinglish: ["Hinglish (Hindi words written in English letters)", "hi", true],
  gujlish: ["Gujarati written in English letters", "gu", true],
};

const h = (s: string) => createHash("sha1").update(s).digest("base64url").slice(0, 16);
const cacheKey = (lang: string) => `plan_tr:${lang}`;

async function translate(strings: string[], lang: string): Promise<string[]> {
  const [label, tl, roman] = LANGS[lang];
  if (aiAvailable()) {
    try {
      const out: string[] = [];
      for (let s = 0; s < strings.length; s += 200) {
        const chunk = strings.slice(s, s + 200);
        const text = await askAIText(`You translate parts of an Indian diet plan into ${label} for a client.
Rules:
- Translate each string in the JSON array. Return ONLY JSON {"t":[...]} with exactly ${chunk.length} strings in the same order.
- Write food and dish names the way families say them at home (Roti, Dal, Chaas, Poha, Thepla in local words/script).
- Keep every number exactly. Serving words (katori, glass, piece, tbsp) in familiar local words. Keep it simple and friendly. No explanations.
${JSON.stringify(chunk)}`, { json: true, maxTokens: 8000, timeoutMs: 25000 });
        const m = text.match(/\{[\s\S]*\}/);
        const arr = m ? (JSON.parse(m[0]).t as unknown[]) : null;
        if (!Array.isArray(arr) || arr.length !== chunk.length) throw new Error("bad answer");
        out.push(...arr.map((x, i) => String(x || chunk[i]).slice(0, 600)));
      }
      return out;
    } catch { /* fall back to Google Translate */ }
  }
  const out = (await freeTranslate(strings, tl, { roman })).map((x, i) => String(x || strings[i]).slice(0, 600));
  if (out.every((x, i) => x === strings[i])) throw new Error("nothing came back");
  return out;
}

export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const lang = String(b?.lang || "");
  if (!LANGS[lang]) return appJson({ error: "Pick a language." }, 400);
  const strings = [...new Set((Array.isArray(b?.strings) ? b.strings : []).map((x: unknown) => String(x ?? "").trim().slice(0, 600)).filter((x: string) => x && !/^[\d\s.,/+-]*$/.test(x)))] as string[];
  if (!strings.length) return appJson({ ok: true, t: {} });
  if (strings.length > 600) return appJson({ error: "This plan is too long to translate at once." }, 400);

  const r = redis();
  const ids = strings.map(h);
  const cached = await r.hmget(cacheKey(lang), ...ids).catch(() => ids.map(() => null));
  const t: Record<string, string> = {};
  const miss: string[] = [];
  strings.forEach((s, i) => { const c = cached[i]; if (c) t[s] = c; else miss.push(s); });

  if (miss.length) {
    const tooMany = await limit(req, "plan-tr", 30, 3600);
    if (tooMany) return tooMany;
    try {
      const out = await translate(miss, lang);
      const save: Record<string, string> = {};
      miss.forEach((s, i) => { t[s] = out[i]; if (out[i] && out[i] !== s) save[h(s)] = out[i]; });
      if (Object.keys(save).length) await r.hset(cacheKey(lang), save).catch(() => {});
    } catch (e) {
      console.error("app plan-translate failed:", String(e).slice(0, 200));
      return appJson({ error: "Couldn't translate right now — please try again in a minute." }, 502);
    }
  }
  return appJson({ ok: true, t });
}
