import { getSiteContent, getDietitianApplicationById } from "@/lib/kv";
import { priceNumber } from "@/lib/couponMath";
import { feeNumber } from "@/lib/feeNumber";

// What a consultation costs with a given dietitian.
// Dr. Astha (the main Health365 dietitian) uses the price set in Admin → Settings
// (with its "was" price). A dietitian who joined through "Join as a dietitian"
// charges the fee they entered in their profile; if that isn't a number, the
// Settings price is used.
export { feeNumber };

export async function consultPrice(dietitianId: string): Promise<{ price: number; original: number; own: boolean }> {
  const c = await getSiteContent();
  const base = { price: priceNumber(c.premiumDiscountedPrice), original: priceNumber(c.premiumOriginalPrice), own: false };
  if (!dietitianId || dietitianId === "dr-astha") return base;
  const d = await getDietitianApplicationById(dietitianId).catch(() => null);
  const n = d && d.status === "approved" ? feeNumber(d.fee) : 0;
  return n > 0 ? { price: n, original: n, own: true } : base;
}
