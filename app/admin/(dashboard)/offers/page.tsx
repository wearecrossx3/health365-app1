import { requireAdminPage } from "@/lib/adminGuard";
import { listOffers } from "@/lib/offers";
import OffersManager from "./OffersManager";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  await requireAdminPage("offers");
  const offers = await listOffers();
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 900, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>App Offers</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Offer popups shown when someone opens the Health365 app. Set dates and they switch on and off by themselves. Only one
            offer shows at a time (the newest live one). Needs app version 1.0.7 or newer.
          </p>
        </div>
        <OffersManager initial={offers} />
      </div>
    </main>
  );
}
