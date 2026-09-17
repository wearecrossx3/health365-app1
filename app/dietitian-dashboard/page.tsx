import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { getDietitianApplicationByUserId } from "@/lib/kv";

export default async function DietitianDashboardPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/join-as-dietitian");

  const app = await getDietitianApplicationByUserId(session.userId);
  if (!app) redirect("/join-as-dietitian");

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 720, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Dietitian dashboard</span>
          <h1 style={{ fontSize: "2rem" }}>Welcome, {app.name}</h1>
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.1rem" }}>Application status</h2>
            <span
              style={{
                fontSize: ".78rem", fontWeight: 700, padding: "6px 13px", borderRadius: 100, color: "#fff",
                background: app.status === "approved" ? "var(--teal)" : app.status === "rejected" ? "var(--terracotta)" : "var(--ink)",
              }}
            >
              {app.status === "approved" ? "Approved" : app.status === "rejected" ? "Not approved" : "Pending review"}
            </span>
          </div>
          {app.status === "pending" && <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>Our team is reviewing your application — this usually doesn't take long.</p>}
          {app.status === "approved" && <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>Your profile is live in the <Link href="/dietitians" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>dietitian directory</Link>.</p>}
          {app.status === "rejected" && <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>Your application wasn't approved this time. Reach out to us if you'd like to update your details and reapply.</p>}
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Your profile</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: ".9rem" }}>
            <div><span style={{ color: "var(--ink-soft)" }}>Qualification</span><br /><b>{app.qualification}</b></div>
            <div><span style={{ color: "var(--ink-soft)" }}>Experience</span><br /><b>{app.experienceYears} years</b></div>
            <div><span style={{ color: "var(--ink-soft)" }}>Location</span><br /><b>{app.location}</b></div>
            <div><span style={{ color: "var(--ink-soft)" }}>Fee</span><br /><b>{app.fee || "Not specified"}</b></div>
            <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--ink-soft)" }}>Specializations</span><br /><b>{app.specializations.join(", ") || "None specified"}</b></div>
            <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--ink-soft)" }}>Languages</span><br /><b>{app.languages.join(", ") || "None specified"}</b></div>
          </div>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 10 }}>Your patients</h2>
          <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>
            No consultations have been assigned to you yet. Once Health365 starts routing consultations to individual dietitians, they&apos;ll show up here.
          </p>
        </div>
      </div>
    </main>
  );
}
