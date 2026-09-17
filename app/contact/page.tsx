import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Health365 team.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 640, paddingTop: 56, paddingBottom: 90 }}>
          <div style={{ marginBottom: 36 }}>
            <span className="eyebrow">Get in touch</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.5rem)" }}>Contact us</h1>
            <p style={{ marginTop: 14, fontSize: "1.02rem", color: "var(--ink-soft)" }}>
              Questions about a consultation, a booking, or joining as a dietitian — send us a message and we&apos;ll get back to you.
            </p>
          </div>
          <ContactForm />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
