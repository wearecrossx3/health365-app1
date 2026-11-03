import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { appJson, appPreflight, limit } from "@/lib/appApi";
import { redis } from "@/lib/kv";
import { askAIText, aiAvailable } from "@/lib/aiText";
import { freeTranslate } from "@/lib/freeTranslate";
import { getFoodDatabase } from "@/lib/foods";
import { foodNamesFor } from "@/lib/foodNames";

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
  gujlish: ["Gujarati written in English letters", "gu", true], en: ["simple English", "en", false],
};

const h = (s: string) => createHash("sha1").update(s).digest("base64url").slice(0, 16);
const cacheKey = (lang: string) => `plan_tr2:${lang}`; // v2: source language detected (plans may be written in Gujarati, Hindi…)

async function translate(strings: string[], lang: string): Promise<string[]> {
  const [label, tl, roman] = LANGS[lang];
  if (aiAvailable()) {
    try {
      const out: string[] = [];
      for (let s = 0; s < strings.length; s += 200) {
        const chunk = strings.slice(s, s + 200);
        const text = await askAIText(`The strings may be in English, Gujarati, Hindi or another Indian language. Translate parts of an Indian diet plan into ${label} for a client.
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
      // Any line that came back in the wrong script (or untranslated) goes to Google instead.
      const bad = out.map((x, i) => (wrongScript(x, lang) || (x === strings[i] && INDIC.test(x) && !inScript(x, lang)) ? i : -1)).filter((i) => i >= 0);
      if (bad.length) {
        const g = await freeTranslate(bad.map((i) => strings[i]), tl, { roman });
        bad.forEach((i, k) => { if (g[k]) out[i] = g[k].slice(0, 600); });
      }
      return out;
    } catch { /* fall back to Google Translate */ }
  }
  return (await freeTranslate(strings, tl, { roman })).map((x, i) => String(x || strings[i]).slice(0, 600));
}

// Script checks for a translated line.
const INDIC = /[\u0600-\u06FF\u0900-\u0DFF]/;
const SCRIPT: Record<string, RegExp> = {
  gu: /[\u0A80-\u0AFF]/, hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, bn: /[\u0980-\u09FF]/, pa: /[\u0A00-\u0A7F]/,
  ta: /[\u0B80-\u0BFF]/, te: /[\u0C00-\u0C7F]/, kn: /[\u0C80-\u0CFF]/, ml: /[\u0D00-\u0D7F]/, ur: /[\u0600-\u06FF]/,
};
function inScript(x: string, lang: string) { const re = SCRIPT[lang]; return !!re && re.test(x); }
function wrongScript(x: string, lang: string) {
  if (!INDIC.test(x)) return false; // Latin text is fine in any language (numbers, kcal, names)
  if (lang === "en" || lang === "hinglish" || lang === "gujlish") return true; // should be English letters
  const re = SCRIPT[lang];
  // any Indian-script letter outside the target script
  return !!re && [...x].some((c) => INDIC.test(c) && !re.test(c));
}

// Food names: Google Translate guesses dish names badly ("Handvo" in
// Gujarati → "hand over"). Plans a dietitian wrote in Gujarati/Hindi mostly use
// our own food list's local names, so those are mapped back to the English
// food name first, then to the target language's name for that food.
const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
async function foodGlossary(target: string, sourceLangs?: string[]) {
  const db = await getFoodDatabase(false);
  const rows = [...db.dishes, ...db.foods];
  const toEn = new Map<string, string>(); // any known name (English or local) → English name
  const servEn = new Map<string, string>();
  let tgt: { names: Record<string, string>; servings: Record<string, string> } | null = null;
  const langs = Object.keys(LANGS).filter((l) => l !== "en");
  // Make sure the food list exists in the plan's own script and in the target.
  const need = [...new Set([...(sourceLangs || []), target].filter((l) => l !== "en" && l in LANGS))];
  if (need.length) await Promise.race([Promise.all(need.map((l) => foodNamesFor(l).catch(() => null))), new Promise((r) => setTimeout(r, 25000))]);
  const vals = await redis().mget(...langs.map((l) => `food_names:${l}:${db.version}:${rows.length}`)).catch(() => langs.map(() => null));
  const byId = new Map(rows.map((f) => [f.id, f]));
  rows.forEach((f) => toEn.set(norm(f.name), f.name));
  langs.forEach((l, i) => {
    if (!vals[i]) return;
    try {
      const d = JSON.parse(vals[i] as string) as { names: Record<string, string>; servings: Record<string, string> };
      for (const [id, loc] of Object.entries(d.names || {})) { const f = byId.get(id); if (f && loc && !toEn.has(norm(loc))) toEn.set(norm(loc), f.name); }
      for (const [en, loc] of Object.entries(d.servings || {})) if (loc) servEn.set(norm(loc), en);
      if (l === target) tgt = d;
    } catch { /* ignore a bad cache entry */ }
  });
  const idByEn = new Map(rows.map((f) => [norm(f.name), f.id]));
  const t = tgt as { names: Record<string, string>; servings: Record<string, string> } | null;
  return {
    /** English food name for a known food, else null. */
    en: (s: string) => toEn.get(norm(s)) || null,
    /** The target language's name for an English food name, if we have it. */
    local: (en: string) => { const id = idByEn.get(norm(en)); return (t && id && t.names[id]) || null; },
    serving: (s: string) => servEn.get(norm(s)) || null,
  };
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
      // Known foods first (exact names from our food list), the rest by translation.
      const srcLangs = [...new Set(miss.map((s) => (/[\u0A80-\u0AFF]/.test(s) ? "gu" : /[\u0900-\u097F]/.test(s) ? "hi" : /[\u0A00-\u0A7F]/.test(s) ? "pa" : /[\u0980-\u09FF]/.test(s) ? "bn" : "")).filter(Boolean))];
      const g = await foodGlossary(lang, srcLangs).catch(() => null);
      const direct: Record<string, string> = {};
      const viaEn: Record<string, string> = {}; // source → English food name to translate
      for (const s of miss) {
        const en = g?.en(s) || g?.serving(s) || null;
        if (!en) continue;
        if (lang === "en") direct[s] = en;
        else { const loc = g?.local(en); if (loc) direct[s] = loc; else viaEn[s] = en; }
      }
      const rest = miss.filter((s) => !(s in direct));
      const src = rest.map((s) => viaEn[s] || s);
      const out = src.length ? await translate(src, lang) : [];
      const save: Record<string, string> = {};
      const put = (s: string, v: string) => { t[s] = v; if (v && v !== s) save[h(s)] = v; };
      Object.entries(direct).forEach(([s, v]) => put(s, v));
      rest.forEach((s, i) => put(s, out[i]));
      if (Object.keys(save).length) await r.hset(cacheKey(lang), save).catch(() => {});
    } catch (e) {
      console.error("app plan-translate failed:", String(e).slice(0, 200));
      return appJson({ error: "Couldn't translate right now — please try again in a minute." }, 502);
    }
  }
  return appJson({ ok: true, t });
}
