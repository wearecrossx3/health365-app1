import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Health365.",
};

function Section({ title, children }: { title: string; children: import("react").ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: ".95rem", color: "var(--ink-soft)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 760, paddingTop: 56, paddingBottom: 90 }}>
          <div style={{ marginBottom: 44 }}>
            <span className="eyebrow">Legal</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.5rem)" }}>Terms of Service</h1>
            <p style={{ marginTop: 14, fontSize: "1rem", color: "var(--ink-soft)" }}>
              Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
            </p>
          </div>

          <Section title="General nutrition guidance, not medical advice">
            <p>
              Health365, including its diet plan generator and condition guides, provides general nutrition
              information. It is not a substitute for professional medical advice, diagnosis, or treatment.
              Always consult your doctor before making significant changes to your diet, especially if you
              have an existing health condition, are pregnant or breastfeeding, or take medication.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              You&apos;re responsible for keeping your login details secure and for anything that happens
              under your account. Please use accurate information when signing up and submitting
              consultations, so any guidance you receive actually fits you.
            </p>
          </Section>

          <Section title="Dietitians on Health365">
            <p>
              Dietitians listed on Health365 are independent professionals. We review applications before a
              profile goes live, but Health365 is not itself providing the clinical advice a dietitian gives
              you directly — that relationship, and the guidance within it, is between you and them.
            </p>
          </Section>

          <Section title="Booking appointments">
            <p>
              When you book a session with a dietitian through Health365, please show up on time or cancel
              in advance where possible. Time-slot availability is offered on a first-come basis.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              Please don&apos;t use Health365 to submit false information, attempt to access other users&apos;
              accounts or data, or interfere with the normal operation of the service.
            </p>
          </Section>

          <Section title="No guarantees">
            <p>
              Diet plans generated automatically are a starting point based on general guidelines — they
              aren&apos;t personally reviewed by a dietitian unless you book a consultation or session.
              Results vary from person to person, and Health365 doesn&apos;t guarantee specific outcomes.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>We may update these terms as the product evolves. Continued use of Health365 means you accept the current version.</p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about these terms? Reach out via our{" "}
              <a href="/contact" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Contact page</a>.
            </p>
          </Section>

          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 20 }}>
            This is a general-purpose terms template, not a substitute for legal advice. Before launch,
            please have it reviewed by a lawyer, particularly around the dietitian marketplace relationship
            and any liability questions specific to a health-guidance product in India.
          </p>
        </div>
      </main>
    </>
  );
}
