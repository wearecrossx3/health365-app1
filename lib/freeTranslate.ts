// Free translation through Google Translate's public endpoint (no key).
// Used when the AI key is missing or the AI call fails.
const GT = "https://translate.googleapis.com/translate_a/single";

type Gt = [Array<[string | null, string | null, unknown?, string?]>, ...unknown[]];

async function call(text: string, tl: string, roman: boolean, signal: AbortSignal): Promise<string> {
  const qs = `client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t${roman ? "&dt=rm" : ""}&ie=UTF-8&oe=UTF-8`;
  const r = await fetch(`${GT}?${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "Mozilla/5.0" },
    body: "q=" + encodeURIComponent(text),
    signal,
  });
  if (!r.ok) throw new Error(`google translate ${r.status}`);
  const d = (await r.json()) as Gt;
  const segs = Array.isArray(d?.[0]) ? d[0] : [];
  if (roman) {
    // romanised target text sits in the segment with no translation, at index 2
    const rm = segs.filter((s) => s && s[0] == null && typeof s[2] === "string").map((s) => s[2] as string).join("");
    if (rm) return rm;
  }
  return segs.map((s) => (s && typeof s[0] === "string" ? s[0] : "")).join("");
}

// Translate many short strings; keeps the order and the count.
export async function freeTranslate(strings: string[], tl: string, opts: { roman?: boolean } = {}): Promise<string[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 45000);
  try {
    const out: string[] = new Array(strings.length);
    // batch strings joined by new lines (max ~4000 chars per call)
    const batches: number[][] = [];
    let cur: number[] = [], len = 0;
    strings.forEach((s, i) => {
      const l = s.length + 1;
      if (cur.length && (len + l > 4000 || cur.length >= 80)) { batches.push(cur); cur = []; len = 0; }
      cur.push(i); len += l;
    });
    if (cur.length) batches.push(cur);
    for (const b of batches) {
      const src = b.map((i) => strings[i].replace(/\n+/g, " ")).join("\n");
      let parts: string[] = [];
      try { parts = (await call(src, tl, !!opts.roman, ctl.signal)).split("\n"); } catch { parts = []; }
      if (parts.length === b.length) { b.forEach((i, k) => (out[i] = parts[k].trim() || strings[i])); continue; }
      // lines got merged — translate one by one (a few at a time)
      for (let k = 0; k < b.length; k += 6) {
        const grp = b.slice(k, k + 6);
        const res = await Promise.all(grp.map((i) => call(strings[i], tl, !!opts.roman, ctl.signal).catch(() => strings[i])));
        grp.forEach((i, j) => (out[i] = (res[j] || strings[i]).trim()));
      }
    }
    return out;
  } finally { clearTimeout(timer); }
}
