import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { listCoupons, getSiteContent } from "@/lib/kv";
import { priceNumber } from "@/lib/couponMath";
import CouponsManager from "./CouponsManager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = verifySessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("coupons")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const [coupons, content] = await Promise.all([listCoupons(), getSiteContent()]);
  const price = priceNumber(content.premiumDiscountedPrice);

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 780, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Coupons</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Discount codes for the paid dietitian consultation. People type the code on the payment step in the app and
            the price updates straight away. Consultation price right now: <b>₹{price || "—"}</b> (change it in Website Settings).
          </p>
        </div>
        <CouponsManager initial={coupons} price={price} />
      </div>
    </main>
  );
}
