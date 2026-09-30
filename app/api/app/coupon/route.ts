import { NextRequest } from "next/server";
import { findCoupon, getSiteContent } from "@/lib/kv";
import { applyCoupon, normalizeCode, priceNumber } from "@/lib/couponMath";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";

// The app checks a coupon on the payment step and shows the new price.
// The booking route checks it AGAIN on the server, so the price shown
// here can't be faked.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "app-coupon", 20, 600);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const code = normalizeCode(body?.code);
  if (!code) return appJson({ error: "Enter a coupon code." }, 400);
  const content = await getSiteContent();
  const base = priceNumber(content.premiumDiscountedPrice);
  const r = applyCoupon(await findCoupon(code), base, session.userId);
  if (!r.ok) return appJson({ error: r.error }, 400);
  return appJson(r);
}
