import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAllUsers, listAllConsultations, listAllDietitianApplications, listAllAppointments } from "@/lib/kv";
import ConsultationRow from "./ConsultationRow";
import AppointmentRow from "./AppointmentRow";
import DietitianActionButtons from "./DietitianActionButtons";

export default async function AdminPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(session)) redirect("/admin/login");

  const [users, consultations, dietitianApps, appointments] = await Promise.all([
    listAllUsers(),
    listAllConsultations(),
    listAllDietitianApplications(),
    listAllAppointments(),
  ]);
  const needsReview = consultations.filter(
    (c) => c.status === "submitted" && c.conditions.length > 0
  );
  const pendingDietitians = dietitianApps.filter((d) => d.status === "pending");

  return (
          <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className="eyebrow">Admin</span>
            <h1 style={{ fontSize: "2rem" }}>Health365 overview</h1>
          </div>
          <a href="/admin/content" className="pill pill-outline">Edit site content →</a>
        </div>

        <div className="admin-stat-grid">
          <div className="panel" style={{ padding: 24 }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Total users</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 6 }}>{users.length}</div>
          </div>
          <div className="panel" style={{ padding: 24 }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Total consultations</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 6 }}>{consultations.length}</div>
          </div>
          <div className="panel" style={{ padding: 24, borderColor: needsReview.length ? "var(--terracotta)" : undefined }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--terracotta)", textTransform: "uppercase" }}>Needs professional review</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 6 }}>{needsReview.length}</div>
          </div>
          <div className="panel" style={{ padding: 24, borderColor: pendingDietitians.length ? "var(--teal)" : undefined }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--teal-deep)", textTransform: "uppercase" }}>Pending dietitians</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 6 }}>{pendingDietitians.length}</div>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Dietitian applications</h2>
          {dietitianApps.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No applications yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dietitianApps.map((d) => (
                <div
                  key={d.id}
                  style={{
                    border: "1.5px solid var(--line)", borderRadius: 14, padding: "14px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
                    background: d.status === "pending" ? "#EAF3EF" : "#fff",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{d.name} — {d.qualification}</p>
                    <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 4 }}>
                      {d.email} · {d.experienceYears} yrs · {d.location} · {d.specializations.join(", ") || "no specialization listed"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: ".72rem", fontWeight: 700, padding: "5px 11px", borderRadius: 100, color: "#fff",
                        background: d.status === "approved" ? "var(--teal)" : d.status === "rejected" ? "var(--terracotta)" : "var(--ink)",
                      }}
                    >
                      {d.status === "approved" ? "Approved" : d.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                    <DietitianActionButtons id={d.id} status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Consultations</h2>
          {consultations.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No consultations submitted yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {consultations.map((c) => <ConsultationRow key={c.id} c={c} />)}
            </div>
          )}
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No appointments booked yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {appointments.map((a) => <AppointmentRow key={a.id} a={a} />)}
            </div>
          )}
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Users</h2>
          {users.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No users yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
                  <span style={{ fontSize: ".9rem", fontWeight: 600 }}>{u.name}</span>
                  <span style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>{u.email}</span>
                  <span style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>
  );
}
