import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { listAllTestimonials } from "@/lib/kv";
import TestimonialsManager from "./TestimonialsManager";

export default async function AdminTestimonialsPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes("testimonials")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const testimonials = await listAllTestimonials();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 780, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Testimonials</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Add real testimonials as you receive them. Only ones marked "Published" show on the site.
          </p>
        </div>
        <TestimonialsManager initial={testimonials} />
      </div>
    </main>
  );
}
