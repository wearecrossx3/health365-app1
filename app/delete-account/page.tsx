import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DeleteAccountForm from "./DeleteAccountForm";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "Permanently delete your Health365 account and data.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 640, paddingTop: 56, paddingBottom: 90 }}>
          <span className="eyebrow">Your data</span>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.5rem)" }}>Delete your Health365 account</h1>
          <p style={{ marginTop: 14, color: "var(--ink-soft)", lineHeight: 1.7 }}>
            This works for accounts made on the website and in the Health365 app. You can also delete your
            account inside the app: <b>Profile → Delete my account</b>.
          </p>
          <div style={{ margin: "24px 0", background: "var(--paper)", borderRadius: 14, padding: "16px 20px", fontSize: ".92rem", lineHeight: 1.7 }}>
            <b>What gets deleted, permanently and right away:</b>
            <ul style={{ paddingLeft: 20, marginTop: 6 }}>
              <li>Your account (name, email, phone, password)</li>
              <li>Your consultations — body measurements, health conditions, food preferences</li>
              <li>Your appointments with dietitians</li>
              <li>Messages you sent to our care team, and your dietitian application if you made one</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              Nothing is kept afterwards, except copies in our email inbox of notification emails already sent to the team.
              Plan, water and weight tracking in the app live only on your phone and are erased when you delete from the app or uninstall it.
            </p>
          </div>
          <DeleteAccountForm />
          <p style={{ marginTop: 20, fontSize: ".88rem", color: "var(--ink-soft)" }}>
            Forgot your password? Ask us through the <a href="/contact" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Contact page</a> from
            your account email and we&apos;ll delete it for you within 7 days.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
