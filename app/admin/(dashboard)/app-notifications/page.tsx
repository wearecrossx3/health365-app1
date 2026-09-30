import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { listAppNotifications } from "@/lib/kv";
import AppNotificationsManager from "./AppNotificationsManager";

export const dynamic = "force-dynamic";

export default async function AdminAppNotificationsPage() {
  const session = verifySessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("app-notifications")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const notifications = await listAppNotifications();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 780, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>App Notifications</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Send a notification to Health365 app users. Phones check for new messages about every 30 minutes,
            so it can take up to half an hour (sometimes a little more when a phone is in battery saver) to arrive.
            Only people who installed app version 1.0.4 or newer and allowed notifications will get it.
          </p>
        </div>
        <AppNotificationsManager initial={notifications} />
      </div>
    </main>
  );
}
