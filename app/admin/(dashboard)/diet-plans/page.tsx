import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { listAllDietTemplates } from "@/lib/kv";
import DietPlansManager from "./DietPlansManager";

export default async function AdminDietPlansPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("diet-plans")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const templates = await listAllDietTemplates();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 820, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Diet Plan Templates</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Write a basic day of meals for a goal or condition below. When someone on the Diet Plan page picks
            it, they&apos;ll get exactly what you&apos;ve written here — in the on-screen plan and the PDF —
            instead of an automatically assembled one. Leave a card empty to keep using the automatic plan for
            that goal (conditions with no card yet just point people to book a consultation, as before).
          </p>
        </div>
        <DietPlansManager initial={templates} />
      </div>
    </main>
  );
}
