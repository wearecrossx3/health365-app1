import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Health365 collects, uses, and protects your information.",
};

function Section({ title, children }: { title: string; children: import("react").ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: ".95rem", color: "var(--ink-soft)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 760, paddingTop: 56, paddingBottom: 90 }}>
          <div style={{ marginBottom: 44 }}>
            <span className="eyebrow">Legal</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.5rem)" }}>Privacy Policy</h1>
            <p style={{ marginTop: 14, fontSize: "1rem", color: "var(--ink-soft)" }}>
              Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
            </p>
          </div>

          <Section title="What we collect">
            <p>When you use Health365, we collect the information you give us directly:</p>
            <ul style={{ marginTop: 10, paddingLeft: 20 }}>
              <li>Account details — your name, email, and password (stored securely, never in plain text)</li>
              <li>Consultation information — age, gender, body measurements, activity level, food preferences, allergies, and any health conditions you choose to share</li>
              <li>Appointment details — which dietitian you book with, and when</li>
              <li>Dietitian applications, if you apply to join as a dietitian — qualifications, experience, and contact details</li>
            </ul>
          </Section>

          <Section title="How we use it">
            <p>
              We use your information to run the service you signed up for — generating your consultation
              summary and diet plans, connecting you with a dietitian, and managing your bookings. If you
              flag a health condition during a consultation, that consultation is routed for review by our
              team or a qualified dietitian, rather than acted on automatically.
            </p>
          </Section>

          <Section title="Who can see it">
            <p>
              Your consultation and health information is visible to the Health365 team and to any dietitian
              you book an appointment with. We do not sell your personal information to third parties, and we
              do not show it to other users.
            </p>
          </Section>

          <Section title="How it's stored">
            <p>
              Your data is stored in a secured database. We take reasonable technical measures to protect it,
              but no online service can guarantee perfect security. Please don&apos;t share sensitive
              information (like government ID numbers or payment details) with us outside of what the product
              explicitly asks for.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use a single session cookie to keep you logged in. We don&apos;t use tracking or advertising
              cookies.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can update your consultation details anytime by submitting a new consultation. To request
              a copy of your data, or to have your account and data deleted, please reach out through our{" "}
              <a href="/contact" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Contact page</a>.
            </p>
          </Section>

          <Section title="Not a medical record">
            <p>
              Health365 provides general nutrition guidance, not medical diagnosis or treatment. Information
              you share with us doesn&apos;t replace your relationship with your doctor, and we&apos;d always
              encourage you to keep your own healthcare providers informed of anything relevant.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy as Health365 grows. If we make a significant change, we&apos;ll do our
              best to let you know.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data? Reach out via our{" "}
              <a href="/contact" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Contact page</a>.
            </p>
          </Section>

          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 20 }}>
            This is a general-purpose privacy policy template. Before launch, please have it reviewed by a
            lawyer familiar with Indian data protection law (including the DPDP Act) to make sure it fully
            reflects how Health365 actually operates.
          </p>
        </div>
      </main>
    </>
  );
}
