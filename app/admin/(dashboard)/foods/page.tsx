import { requireAdminPage } from "@/lib/adminGuard";
import FoodsManager from "./FoodsManager";

export const dynamic = "force-dynamic";

export default async function FoodsPage() {
  await requireAdminPage("foods");
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 1000, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Food Database</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            What the app&apos;s calorie counter searches. 528 foods come straight from the Indian Food Composition Tables 2017
            (ICMR-NIN, per 100 g). The everyday dishes (roti, dal, poha, sabzi…) are worked out from those IFCT values using
            standard home recipes. Correct a value, hide something, or add your own — the app picks up changes automatically.
          </p>
        </div>
        <FoodsManager />
      </div>
    </main>
  );
}
