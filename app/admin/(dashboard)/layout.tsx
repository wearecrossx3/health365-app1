import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import AdminSidebar from "./AdminSidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(session)) redirect("/admin/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <AdminSidebar adminName={session!.name} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
