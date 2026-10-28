// Turns a diet plan into (1) a print-ready page the browser can save as PDF
// and (2) short text for WhatsApp. Used by the plan builder (admin + dietitian).

type It = { name: string; portion: string; kcal: number; protein?: number };
type Ml = { label: string; time?: string; items: It[]; kcal: number };
type Dy = { label: string; meals: Ml[]; kcal: number };
export type PrintablePlan = { title: string; targetKcal?: number; days: Dy[]; tips?: string[] };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export function planHtml(p: PrintablePlan, opts: { client?: string; from?: string; note?: string } = {}): string {
  const days = p.days.map((d) => `
    <section class="day">
      <h2>${esc(d.label)} <span>${d.kcal} kcal</span></h2>
      <table>
        ${d.meals.map((m) => `
          <tr><th colspan="3">${esc(m.label)}${m.time ? ` <small>· ${esc(m.time)}</small>` : ""}<b>${m.kcal} kcal</b></th></tr>
          ${m.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.portion)}</td><td class="k">${Number(i.kcal) || 0}</td></tr>`).join("")}
        `).join("")}
      </table>
    </section>`).join("");
  const tips = (p.tips || []).length ? `<section class="tips"><h3>Tips</h3><ul>${(p.tips || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.title)} — Health365</title>
<style>
*{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1F2B2C;margin:0;padding:28px 32px;font-size:13px}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #287379;padding-bottom:12px;margin-bottom:14px}
header img{height:34px}header .m{text-align:right;font-size:12px;color:#555}
h1{font-size:20px;margin:0 0 4px}.sub{color:#555;margin:0 0 12px}.note{background:#F2F8F6;border-radius:8px;padding:10px 12px;margin-bottom:14px}
.day{break-inside:avoid;margin-bottom:16px}.day h2{font-size:15px;margin:0 0 6px;color:#287379;display:flex;justify-content:space-between}
.day h2 span{color:#555;font-weight:600;font-size:12px}table{width:100%;border-collapse:collapse}
th{text-align:left;background:#F4F1EA;padding:6px 8px;font-size:12.5px}th small{font-weight:400;color:#666}th b{float:right;font-weight:600;color:#287379}
td{padding:5px 8px;border-bottom:1px solid #eee}td.k{text-align:right;width:60px;color:#555}
.tips{break-inside:avoid}.tips h3{font-size:14px;margin:6px 0}footer{margin-top:18px;font-size:10.5px;color:#888;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:0}@page{margin:14mm}}
</style></head><body>
<header><img src="https://www.thehealth365.in/email-logo.png" alt="Health365"><div class="m">${opts.client ? `For <b>${esc(opts.client)}</b><br>` : ""}${opts.from ? `By ${esc(opts.from)}<br>` : ""}${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></header>
<h1>${esc(p.title)}</h1>
<p class="sub">${p.targetKcal ? `About ${p.targetKcal} kcal a day · ` : ""}${p.days.length} day${p.days.length > 1 ? "s" : ""}</p>
${opts.note ? `<div class="note">${esc(opts.note)}</div>` : ""}
${days}${tips}
<footer>Health365 · thehealth365.in — general nutrition guidance from your dietitian, not a medical diagnosis. Follow your doctor's advice for any medical condition.</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body></html>`;
}

export function planText(p: PrintablePlan, opts: { client?: string; from?: string } = {}): string {
  const lines: string[] = [`*${p.title}*${opts.client ? ` — for ${opts.client}` : ""}`];
  if (p.targetKcal) lines.push(`About ${p.targetKcal} kcal a day`);
  for (const d of p.days) {
    lines.push("", `*${d.label}* (${d.kcal} kcal)`);
    for (const m of d.meals) lines.push(`• ${m.label}${m.time ? ` (${m.time})` : ""}: ${m.items.map((i) => `${i.name} – ${i.portion}`).join(", ")}`);
  }
  lines.push("", `${opts.from ? `— ${opts.from}, ` : ""}Health365 · thehealth365.in`);
  return lines.join("\n");
}

export function openPrint(p: PrintablePlan, opts: { client?: string; from?: string; note?: string } = {}) {
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to save the PDF."); return; }
  w.document.open();
  w.document.write(planHtml(p, opts));
  w.document.close();
}

export async function sharePlanText(p: PrintablePlan, opts: { client?: string; from?: string; phone?: string } = {}) {
  const text = planText(p, opts);
  const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
  if (!opts.phone && nav.share) {
    try { await nav.share({ title: p.title, text }); return; } catch { /* fall back to WhatsApp link */ }
  }
  const ph = (opts.phone || "").replace(/\D/g, "").slice(-10);
  window.open(`https://wa.me/${ph ? `91${ph}` : ""}?text=${encodeURIComponent(text)}`, "_blank");
}
