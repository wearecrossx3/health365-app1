import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listCoupons, saveCoupons } from "@/lib/kv";
import { Coupon, normalizeCode } from "@/lib/couponMath";

async function allowed(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  return isAdmin(session, "coupons");
}
const deny = () => NextResponse.json({ error: "Not authorized." }, { status: 403 });

export async function GET(req: NextRequest) {
  if (!(await allowed(req))) return deny();
  return NextResponse.json({ coupons: await listCoupons() });
}

// Create a coupon.
export async function POST(req: NextRequest) {
  if (!(await allowed(req))) return deny();
  const b = await req.json().catch(() => null);
  const code = normalizeCode(b?.code);
  const type = b?.type === "flat" ? "flat" : "percent";
  const value = Math.round(Number(b?.value) || 0);
  if (code.length < 3) return NextResponse.json({ error: "Code must be at least 3 letters or numbers." }, { status: 400 });
  if (value <= 0 || (type === "percent" && value > 100)) {
    return NextResponse.json({ error: type === "percent" ? "Discount must be between 1 and 100%." : "Discount must be more than ₹0." }, { status: 400 });
  }
  const expiresOn = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.expiresOn || "")) ? String(b.expiresOn) : "";
  const all = await listCoupons();
  if (all.some((c) => c.code === code)) return NextResponse.json({ error: `A coupon called ${code} already exists.` }, { status: 409 });
  const coupon: Coupon = {
    code,
    type,
    value,
    active: true,
    maxUses: Math.max(0, Math.round(Number(b?.maxUses) || 0)),
    used: 0,
    onePerUser: Boolean(b?.onePerUser),
    usedBy: [],
    expiresOn,
    note: String(b?.note || "").trim().slice(0, 120),
    createdAt: new Date().toISOString(),
  };
  await saveCoupons([coupon, ...all]);
  return NextResponse.json({ ok: true, coupon });
}

// Turn a coupon on/off.
export async function PATCH(req: NextRequest) {
  if (!(await allowed(req))) return deny();
  const b = await req.json().catch(() => null);
  const code = normalizeCode(b?.code);
  const all = await listCoupons();
  const c = all.find((x) => x.code === code);
  if (!c) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  if (typeof b?.active === "boolean") c.active = b.active;
  await saveCoupons(all);
  return NextResponse.json({ ok: true, coupon: c });
}

export async function DELETE(req: NextRequest) {
  if (!(await allowed(req))) return deny();
  const b = await req.json().catch(() => null);
  const code = normalizeCode(b?.code);
  const all = await listCoupons();
  await saveCoupons(all.filter((c) => c.code !== code));
  return NextResponse.json({ ok: true });
}
