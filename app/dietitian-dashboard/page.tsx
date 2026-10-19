import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { getDietitianApplicationByUserId, getAppointmentsForDietitian } from "@/lib/kv";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default async function DietitianDashboardPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/join-as-dietitian");

  const app = await getDietitianApplicationByUserId(session.userId);
  if (!app) redirect("/join-as-dietitian");

  const appointments = app.status === "approved" ? await getAppointmentsForDietitian(app.id) : [];
  const upcoming = appointments
    .filter((a) => a.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
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
          {app.status === "approved" && (
            <div style={{ marginTop: 14, background: "#E3F0F0", borderRadius: 14, padding: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/downloads/dietitian-icon.png" alt="" width={52} height={52} style={{ borderRadius: 14 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <b>Get the Health365 Dietitian app</b>
                <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginTop: 2 }}>Chat with your clients and send diet plans from your phone.</p>
              </div>
              <Link href="/dietitian-app" className="pill pill-primary" style={{ padding: "10px 18px" }}>Download</Link>
              <Link href="/admin/login" className="pill pill-outline" style={{ padding: "10px 18px" }}>Open in browser</Link>
            </div>
          )}
          {app.status === "rejected" && <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>Your application wasn't approved this time. Reach out to us if you'd like to update your details and reapply.</p>}
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Your profile</h2>
          <div className="profile-fields-grid">
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
          {app.status !== "approved" ? (
            <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>
              Appointments will appear here once your application is approved.
            </p>
          ) : upcoming.length === 0 ? (
            <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>
              No appointments booked yet. Once someone books a session with you from the directory, it&apos;ll show up here.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", padding: "10px 0", fontSize: ".9rem" }}>
                  <span style={{ fontWeight: 600 }}>{a.userName}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{new Date(a.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
