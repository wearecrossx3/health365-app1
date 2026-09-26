import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { getAppContent } from "@/lib/kv";
import AppContentForm from "./AppContentForm";

export const dynamic = "force-dynamic";

export default async function AdminAppContentPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("app")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const content = await getAppContent();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 720, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Mobile App</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Icons, banners and carousels inside the Health365 Android app. Saved changes reach the app the next
            time someone opens it — no new APK needed. Leave any image empty to keep the app&apos;s built-in one.
          </p>
        </div>
        <AppContentForm initial={content} />
      </div>
    </main>
  );
}
