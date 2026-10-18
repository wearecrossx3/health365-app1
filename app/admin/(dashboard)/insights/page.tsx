import { requireAdminPage } from "@/lib/adminGuard";
import { getInsights, getFollowUps } from "@/lib/insights";
import { listAppErrors } from "@/lib/appErrors";
import { referralTotals } from "@/lib/referral";
import InsightsView from "./InsightsView";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  await requireAdminPage("dashboard");
  const [ins, followUps, errors, refs] = await Promise.all([
    getInsights(),
    getFollowUps().catch(() => []),
    listAppErrors().catch(() => []),
    referralTotals().catch(() => ({ referredSignups: 0 })),
  ]);
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Insights</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            How many people use the app, who needs a follow-up, and any problems the app hit on people&apos;s phones.
            App numbers start counting from app version 2.0.1.
          </p>
        </div>
        <InsightsView ins={ins} followUps={followUps} errors={errors} referred={refs.referredSignups} />
      </div>
    </main>
  );
}
