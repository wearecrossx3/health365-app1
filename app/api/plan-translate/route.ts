import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminGuard";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { askAIText, aiAvailable } from "@/lib/aiText";
import { freeTranslate } from "@/lib/freeTranslate";
import { isRateLimited } from "@/lib/kv";

// Translate a diet plan (titles, meals, foods, portions, tips) into the
// client's language — for the admin plan maker and the dietitian app.
// Numbers (kcal, protein) never change.
export const maxDuration = 60;

const PLAN_LANGS: Record<string, string> = {
  gu: "Gujarati (ગુજરાતી script)", hi: "Hindi (Devanagari script)", mr: "Marathi (Devanagari script)", bn: "Bengali (Bengali script)",
  pa: "Punjabi (Gurmukhi script)", ta: "Tamil (Tamil script)", te: "Telugu (Telugu script)", kn: "Kannada (Kannada script)",
  ml: "Malayalam (Malayalam script)", ur: "Urdu (Urdu script)", hinglish: "Hinglish (Hindi words written in English letters)",
  gujlish: "Gujarati written in English letters", en: "simple English",
};

type Item = { name: string; portion: string; [k: string]: unknown };
type Meal = { label: string; title?: string; alt?: string; items: Item[]; [k: string]: unknown };
type Day = { label: string; meals: Meal[]; [k: string]: unknown };
type Plan = { title: string; tips?: string[]; days: Day[]; [k: string]: unknown };

export async function POST(req: NextRequest) {
  const admin = await adminFromRequest(req, "users");
  const dt = admin ? null : await dietitianFromRequest(req);
  if (!admin && !dt) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const who = admin ? `a:${admin.userId}` : `d:${dt!.dietitianId}`;
  if (await isRateLimited(`plan-tr:${who}`, 40, 86400)) return NextResponse.json({ error: "You've translated a lot of plans today. Please try again tomorrow." }, { status: 429 });

  const b = await req.json().catch(() => null);
  const lang = String(b?.lang || "");
  const plan = b?.plan as Plan | undefined;
  const note = typeof b?.note === "string" ? b.note.slice(0, 1000) : "";
  if (!PLAN_LANGS[lang]) return NextResponse.json({ error: "Pick a language." }, { status: 400 });
  if (!plan || !Array.isArray(plan.days) || !plan.days.length || JSON.stringify(plan).length > 150000) return NextResponse.json({ error: "No plan to translate." }, { status: 400 });

  // Collect every piece of text once.
  const strings: string[] = [];
  const idx = new Map<string, number>();
  const add = (s: unknown) => { const t = String(s ?? "").trim(); if (!t || /^[\d\s.,/+-]*$/.test(t)) return; if (!idx.has(t)) { idx.set(t, strings.length); strings.push(t); } };
  add(plan.title); (plan.tips || []).forEach(add); note.split("\n").forEach(add);
  for (const d of plan.days) { add(d.label); for (const m of d.meals) { add(m.label); add(m.title); add(m.alt); for (const i of m.items) { add(i.name); add(i.portion); } } }
  if (strings.length > 900) return NextResponse.json({ error: "This plan is too long to translate at once." }, { status: 400 });

  // 1) AI (better dish names) when a key is set, 2) free Google Translate otherwise or if AI fails.
  let out: string[] = [];
  let engine = "";
  const errors: string[] = [];
  if (aiAvailable()) {
    try {
      for (let s = 0; s < strings.length; s += 250) {
        const chunk = strings.slice(s, s + 250);
        const prompt = `The plan may be written in English, Gujarati, Hindi or another Indian language. Translate an Indian diet plan for a client into ${PLAN_LANGS[lang]}.
Rules:
- Translate each string in the JSON array. Return ONLY JSON: {"t": [ ... ]} with exactly ${chunk.length} strings in the same order.
- Write food and dish names the way people in that language actually say them at home (e.g. Roti → the local word for roti; Dal, Chaas, Poha in local script).
- Keep every number exactly. Keep units short and familiar (g, ml, kcal may stay as they are; "katori", "glass", "cup", "medium" → local words).
- Keep it simple and friendly. Do not add anything, do not explain.
Strings:
${JSON.stringify(chunk)}`;
        const text = await askAIText(prompt, { json: true, maxTokens: 8000, timeoutMs: 25000 });
        const m = text.match(/\{[\s\S]*\}/);
        const arr = m ? (JSON.parse(m[0]).t as unknown[]) : null;
        if (!Array.isArray(arr) || arr.length !== chunk.length) throw new Error("AI gave a bad answer");
        out.push(...arr.map((x, i) => String(x || chunk[i]).slice(0, 400)));
      }
      engine = "ai";
    } catch (e) {
      errors.push(String(e).slice(0, 160));
      out = [];
    }
  }
  if (!engine) {
    const G: Record<string, [string, boolean]> = { gu: ["gu", false], hi: ["hi", false], mr: ["mr", false], bn: ["bn", false], pa: ["pa", false], ta: ["ta", false], te: ["te", false], kn: ["kn", false], ml: ["ml", false], ur: ["ur", false], hinglish: ["hi", true], gujlish: ["gu", true], en: ["en", false] };
    try {
      const [tl, roman] = G[lang];
      out = (await freeTranslate(strings, tl, { roman })).map((x, i) => String(x || strings[i]).slice(0, 400));
      if (out.every((x, i) => x === strings[i]) && lang !== "en") throw new Error("nothing came back");
      engine = "google";
    } catch (e) {
      errors.push(String(e).slice(0, 160));
    }
  }
  if (!engine) {
    console.error("plan-translate failed:", errors.join(" | "));
    return NextResponse.json({ error: "Couldn't translate right now — please try again in a minute.", detail: errors.join(" | ") }, { status: 502 });
  }

  const tr = (s: unknown) => { const t = String(s ?? "").trim(); const i = idx.get(t); return i === undefined ? s : out[i]; };
  const res: Plan = {
    ...plan,
    title: String(tr(plan.title)),
    tips: (plan.tips || []).map((x) => String(tr(x))),
    days: plan.days.map((d) => ({
      ...d, label: String(tr(d.label)),
      meals: d.meals.map((m) => ({ ...m, label: String(tr(m.label)), title: m.title ? String(tr(m.title)) : m.title, alt: m.alt ? String(tr(m.alt)) : m.alt, items: m.items.map((i) => ({ ...i, name: String(tr(i.name)), portion: String(tr(i.portion)) })) })),
    })),
    lang,
  };
  return NextResponse.json({ ok: true, plan: res, note: note ? note.split("\n").map((l: string) => (l.trim() ? String(tr(l)) : l)).join("\n") : "", engine });
}
