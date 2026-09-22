import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { getSiteContent } from "@/lib/kv";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("settings")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const content = await getSiteContent();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 600, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Website Settings</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Contact details shown on the Contact page. Changes go live immediately.
          </p>
        </div>
        <SettingsForm
          initial={{
            siteTitle: content.siteTitle,
            contactEmail: content.contactEmail,
            contactPhone: content.contactPhone,
            whatsappNumber: content.whatsappNumber,
            instagramUrl: content.instagramUrl,
            youtubeUrl: content.youtubeUrl,
            pinterestUrl: content.pinterestUrl,
            linkedinUrl: content.linkedinUrl,
            premiumOriginalPrice: content.premiumOriginalPrice,
            premiumDiscountedPrice: content.premiumDiscountedPrice,
            premiumUpiId: content.premiumUpiId,
          }}
        />
      </div>
    </main>
  );
}
