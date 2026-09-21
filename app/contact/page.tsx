import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactForm from "./ContactForm";
import { getSiteContent } from "@/lib/kv";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Health365 team.",
};

export default async function ContactPage() {
  const content = await getSiteContent();
  const hasDirectContact = content.contactEmail || content.contactPhone || content.whatsappNumber || content.instagramUrl;

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

          {hasDirectContact && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 40, padding: "20px 24px", background: "var(--paper)", borderRadius: 16 }}>
              {content.contactEmail && <a href={`mailto:${content.contactEmail}`} style={{ fontSize: ".9rem", fontWeight: 600 }}>{content.contactEmail}</a>}
              {content.contactPhone && <a href={`tel:${content.contactPhone}`} style={{ fontSize: ".9rem", fontWeight: 600 }}>{content.contactPhone}</a>}
              {content.whatsappNumber && <a href={`https://wa.me/${content.whatsappNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".9rem", fontWeight: 600 }}>WhatsApp us</a>}
              {content.instagramUrl && <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".9rem", fontWeight: 600 }}>Instagram</a>}
            </div>
          )}

          <ContactForm />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
