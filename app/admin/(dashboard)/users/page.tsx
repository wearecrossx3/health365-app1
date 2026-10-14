import { requireAdminPage } from "@/lib/adminGuard";
import UsersManager from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdminPage("users");
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 860, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Users &amp; Plans</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Everyone with an account (app or website). After a paid consultation, open the user and assign their diet — it appears
            in their app automatically. Each user gets their first 7-day plan free; after that 7-day plans are locked unless you
            give them one here. 1-day plans are always free.
          </p>
        </div>
        <UsersManager />
      </div>
    </main>
  );
}
