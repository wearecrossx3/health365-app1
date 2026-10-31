// Text-only AI calls (Gemini first, Claude as fallback) — same keys as the
// food scanner. Returns the model's raw text.
let modelCache: { at: number; names: string[] } | null = null;

async function availableModels(key: string): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 3600_000) return modelCache.names;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`);
    const d = await r.json().catch(() => ({}));
    const names: string[] = (d.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""));
    if (names.length) modelCache = { at: Date.now(), names };
    return names;
  } catch { return []; }
}

function pickModels(names: string[]): string[] {
  const want = (process.env.GEMINI_MODEL || "").trim();
  const ok = (n: string) => /flash/.test(n) && !/image|tts|audio|live|embed|native|thinking-exp|computer/.test(n);
  const ver = (n: string) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");
  const stable = names.filter((n) => ok(n) && !/preview|exp/.test(n)).sort((a, b) => ver(b) - ver(a) || (/lite/.test(a) ? 1 : -1));
  const out = [
    ...(want && (!names.length || names.includes(want)) ? [want] : []),
    ...["gemini-flash-latest"].filter((n) => !names.length || names.includes(n)),
    ...stable.slice(0, 3),
    ...(names.length ? [] : ["gemini-2.5-flash"]),
  ];
  return out.filter((m, i, a) => a.indexOf(m) === i).slice(0, 4);
}

export const aiAvailable = () => !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);

export async function askAIText(prompt: string, opts: { json?: boolean; maxTokens?: number; timeoutMs?: number } = {}): Promise<string> {
  const gk = process.env.GEMINI_API_KEY, ck = process.env.ANTHROPIC_API_KEY;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs || 50000);
  try {
    let last = "";
    if (gk) {
      for (const model of pickModels(await availableModels(gk))) {
        for (const fast of [true, false]) {
          const generationConfig: Record<string, unknown> = { temperature: 0.2, maxOutputTokens: opts.maxTokens || 8000 };
          if (opts.json) generationConfig.responseMimeType = "application/json";
          if (fast) generationConfig.thinkingConfig = { thinkingBudget: 0 };
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(gk)}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }), signal: ctl.signal,
          });
          const d = await r.json().catch(() => ({}));
          if (r.ok) {
            const text = (d.candidates?.[0]?.content?.parts || []).filter((x: { thought?: boolean }) => !x.thought).map((x: { text?: string }) => x.text || "").join("");
            if (text) return text;
            last = `${model}: empty answer`; break;
          }
          last = `${model} ${r.status}: ${String(d.error?.message || "").slice(0, 160)}`;
          if (r.status === 400 && fast) continue;
          break;
        }
      }
    }
    if (ck) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ck, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001", max_tokens: opts.maxTokens || 8000, messages: [{ role: "user", content: prompt }] }),
        signal: ctl.signal,
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return (d.content || []).map((x: { text?: string }) => x.text || "").join("");
      last = `claude ${r.status}`;
    }
    throw new Error(last || "No AI key set");
  } finally { clearTimeout(timer); }
}
