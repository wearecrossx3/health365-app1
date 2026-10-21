import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DietitianTermsText from "@/components/DietitianTermsText";

export const metadata: Metadata = {
  title: "Terms for dietitians",
  description: "The terms every dietitian accepts before joining Health365.",
};

export default function DietitianTermsPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--paper)" }}>
        <div className="wrap" style={{ maxWidth: 720, paddingTop: 48, paddingBottom: 90 }}>
          <span className="eyebrow">Join Health365</span>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", marginBottom: 20 }}>Terms for dietitians</h1>
          <div className="step-card"><DietitianTermsText /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
