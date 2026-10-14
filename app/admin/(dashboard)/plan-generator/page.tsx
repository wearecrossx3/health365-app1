import { requireAdminPage } from "@/lib/adminGuard";
import PlanBuilder from "./PlanBuilder";

export const dynamic = "force-dynamic";

export default async function PlanGeneratorPage() {
  await requireAdminPage("users");
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 860, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Plan Generator</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Make a realistic Indian 7-day (or 1-day) diet plan in one click — real thalis, rotated through the week, sized to the
            calorie target. Edit anything, then send it to a user. The app&apos;s own free plans use this same engine.
          </p>
        </div>
        <PlanBuilder />
      </div>
    </main>
  );
}
