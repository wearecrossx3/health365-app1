import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getSiteContent } from "@/lib/kv";
import ContentEditorForm from "./ContentEditorForm";

export default async function AdminContentPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(session)) redirect("/admin/login");

  const content = await getSiteContent();

  return (
      <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 680, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Edit site content</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Changes here go live on the homepage immediately — no code, no redeploy.
          </p>
        </div>
        <ContentEditorForm initial={content} />
      </div>
      </main>
  );
}
