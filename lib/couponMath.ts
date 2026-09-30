// Pure coupon maths — no database imports, so the admin page (client
// component) can use it for its live preview too.

export interface Coupon {
  code: string; // stored UPPERCASE, e.g. "NAVRATRI20"
  type: "percent" | "flat";
  value: number; // 20 = 20% off, or ₹20 off for "flat"
  active: boolean;
  maxUses: number; // 0 = unlimited
  used: number;
  onePerUser: boolean;
  usedBy: string[]; // user ids (only kept when onePerUser)
  expiresOn: string; // "YYYY-MM-DD" (last valid day, India time) or "" for never
  note: string; // admin-only reminder, e.g. "Instagram giveaway"
  createdAt: string;
}

export function normalizeCode(code: unknown): string {
  return String(code ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
}

export function priceNumber(p: unknown): number {
  const n = parseFloat(String(p ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function todayIST(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export type CouponResult =
  | { ok: true; code: string; original: number; discount: number; price: number; label: string }
  | { ok: false; error: string };

// Checks a coupon for one user and works out the new price.
export function applyCoupon(c: Coupon | null | undefined, basePrice: number, userId?: string, now = new Date()): CouponResult {
  if (!c) return { ok: false, error: "That coupon code isn't valid." };
  if (!c.active) return { ok: false, error: "This coupon is no longer active." };
  if (c.expiresOn && todayIST(now) > c.expiresOn) return { ok: false, error: "This coupon has expired." };
  if (c.maxUses > 0 && c.used >= c.maxUses) return { ok: false, error: "This coupon has been fully used." };
  if (c.onePerUser && userId && c.usedBy.includes(userId)) return { ok: false, error: "You've already used this coupon." };
  const discount = Math.min(
    basePrice,
    c.type === "percent" ? Math.round((basePrice * Math.min(100, Math.max(0, c.value))) / 100) : Math.max(0, Math.round(c.value))
  );
  const price = basePrice - discount;
  const label = c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`;
  return { ok: true, code: c.code, original: basePrice, discount, price, label: price === 0 ? "Free with coupon" : label };
}
