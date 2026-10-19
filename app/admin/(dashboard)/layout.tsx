import { cookies, headers } from "next/headers";
import { isDietitianApp } from "@/lib/portal";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import AdminSidebar from "./AdminSidebar";
import PushNotificationSetup from "./PushNotificationSetup";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.allowed) redirect("/admin/login");
  // Joined dietitians get their own app-style portal, without the admin menu.
  if (access.dietitianId || isDietitianApp(headers().get("user-agent"))) return <>{children}</>;

  return (
    <div className="admin-shell">
      <AdminSidebar adminName={session!.name} permissions={access.permissions} isSuperAdmin={access.isSuperAdmin} />
      <div className="admin-content">
        {!access.dietitianId && <PushNotificationSetup />}
        {children}
      </div>
    </div>
  );
}
