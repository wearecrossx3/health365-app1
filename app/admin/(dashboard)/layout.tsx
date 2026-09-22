import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import AdminSidebar from "./AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.allowed) redirect("/admin/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <AdminSidebar adminName={session!.name} permissions={access.permissions} isSuperAdmin={access.isSuperAdmin} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
