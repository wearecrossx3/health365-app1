// "₹800 per session" → 800. Safe to use in the browser (no database imports).
export function feeNumber(fee: unknown): number {
  const m = String(fee ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Math.round(Number(m[0])) : 0;
}
