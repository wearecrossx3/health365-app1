import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { getConsultationsForUser, getAppointmentsForUser } from "@/lib/kv";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/login");

  const [consultations, appointments] = await Promise.all([
    getConsultationsForUser(session.userId),
    getAppointmentsForUser(session.userId),
  ]);
  const upcoming = appointments
    .filter((a) => a.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const needsReviewCount = consultations.filter((c) => c.status === "submitted").length;

  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--paper)" }}>
        <div className="wrap" style={{ maxWidth: 880, paddingTop: 48, paddingBottom: 90 }}>
          <div className="admin-row" style={{ marginBottom: 32 }}>
            <div>
              <span className="eyebrow">Dashboard</span>
              <h1 style={{ fontSize: "2rem" }}>Welcome back, {session.name}</h1>
            </div>
            <LogoutButton />
          </div>

          <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="panel" style={{ padding: 22 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Consultations</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: 6 }}>{consultations.length}</div>
            </div>
            <div className="panel" style={{ padding: 22 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Appointments</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: 6 }}>{upcoming.length}</div>
            </div>
            <div className="panel" style={{ padding: 22, borderColor: needsReviewCount ? "var(--teal)" : undefined }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--teal-deep)", textTransform: "uppercase" }}>Under review</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: 6 }}>{needsReviewCount}</div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <div className="admin-row" style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8 }}>📋 Your consultations</h2>
              <Link href="/consultation" className="pill pill-primary" style={{ padding: "9px 18px", fontSize: ".82rem" }}>
                Start a new consultation
              </Link>
            </div>

            {consultations.length === 0 ? (
              <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>
                No consultations yet — start one to get your first nutrition plan.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {consultations.map((c) => (
                  <div key={c.id} style={{ border: "1.5px solid var(--line)", borderRadius: 16, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{c.goal}</p>
                      <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 4 }}>
                        {c.dietType} · Submitted {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: ".72rem", fontWeight: 700, padding: "5px 12px", borderRadius: 100, color: "#fff",
                        background: c.status === "reviewed" ? "var(--teal)" : "var(--ink)",
                      }}
                    >
                      {c.status === "submitted" ? "Under review" : "✓ Reviewed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/diet-plan" className="pill pill-outline" style={{ padding: "10px 18px", fontSize: ".85rem" }}>🥗 Generate a diet plan</Link>
            <Link href="/conditions" className="pill pill-outline" style={{ padding: "10px 18px", fontSize: ".85rem" }}>🩺 Browse conditions</Link>
            <Link href="/dietitians" className="pill pill-outline" style={{ padding: "10px 18px", fontSize: ".85rem" }}>👩‍⚕️ Find a dietitian</Link>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>📅 Your appointments</h2>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>No appointments booked yet — find a dietitian and pick a time that works for you.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map((a) => (
                  <div key={a.id} style={{ border: "1.5px solid var(--line)", borderRadius: 16, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{a.dietitianName}</p>
                      <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 4 }}>
                        {new Date(a.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at {a.time}
                      </p>
                    </div>
                    <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "5px 12px", borderRadius: 100, color: "#fff", background: "var(--teal)" }}>Booked</span>
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
