import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isSuperAdmin } from "@/lib/admin";
import { listAdminAccounts } from "@/lib/kv";
import AdminUsersManager from "./AdminUsersManager";

export default async function AdminUsersPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!isSuperAdmin(session)) redirect("/admin");

  const accounts = await listAdminAccounts();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 780, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Admin Users</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Give someone else — another dietitian, a team member — access to specific parts of this admin panel.
            They log in at the same admin login page with their normal Health365 account (email and password) —
            they just need to have created that account first via the regular sign-up page. What you check below
            decides exactly what they can see once they&apos;re in; nothing else.
          </p>
        </div>
        <AdminUsersManager initial={accounts} />
      </div>
    </main>
  );
}
