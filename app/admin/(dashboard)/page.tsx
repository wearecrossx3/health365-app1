import { cookies, headers } from "next/headers";
import { isDietitianApp, isOwnerApp, portalDietitian } from "@/lib/portal";
import OwnerHome from "./OwnerHome";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess, defaultAdminPath } from "@/lib/admin";
import { listAllUsers, listAllConsultations, listAllDietitianApplications, listAllAppointments } from "@/lib/kv";
import ConsultationRow from "./ConsultationRow";
import AppointmentRow from "./AppointmentRow";
import DietitianActionButtons from "./DietitianActionButtons";
import { getScanHealth } from "@/lib/scanStats";
import AdminAlertsCard from "./AdminAlertsCard";
import WhatsAppAlertsCard from "./WhatsAppAlertsCard";
import { ADMIN_APP, DIETITIAN_APP } from "@/lib/appDownloads";
import { getWhatsAppHealth } from "@/lib/whatsapp";

export default async function AdminPage({ searchParams }: { searchParams?: { full?: string } }) {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (isDietitianApp(headers().get("user-agent")) && (await portalDietitian(session))) redirect("/admin/my-clients");
  if (!access.permissions.includes("dashboard")) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");

  const [users, consultations, dietitianApps, appointments, scan] = await Promise.all([
    listAllUsers(),
    listAllConsultations(),
    listAllDietitianApplications(),
    listAllAppointments(),
    getScanHealth(),
  ]);
  const wa = await getWhatsAppHealth().catch(() => null);
  const when = (t: number) => (t ? new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");
  const limitHit = !!scan.lastError && scan.lastError.outcome === "quota" && scan.lastError.at > scan.lastOk;
  const scanStatus = !scan.configured ? ["Not set up", "var(--ink-soft)", "Add GEMINI_API_KEY in Vercel to switch the scanner on."]
    : limitHit ? ["Limit reached", "var(--terracotta)", "The AI key has used up its quota. Users see “Scanner is resting”. Turn on billing for the key (paid tier) in Google AI Studio, or wait for the free limit to reset."]
    : scan.lastError && scan.lastError.at > scan.lastOk ? ["Errors", "var(--terracotta)", "The last scan failed — see the error below."]
    : ["Working", "var(--teal)", "Scans are going through."];
  const needsReview = consultations.filter(
    (c) => c.status === "submitted" && c.conditions.length > 0
  );
  const pendingDietitians = dietitianApps.filter((d) => d.status === "pending");
  if (isOwnerApp(headers().get("user-agent")) && !searchParams?.full)
    return <OwnerHome name={session?.name || ""} users={users} needsReview={needsReview} pending={pendingDietitians} appointments={appointments} consultations={consultations.length} />;

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

        <AdminAlertsCard />
        <WhatsAppAlertsCard />

        <div className="panel" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.2rem" }}>Team apps</h2>
          <p className="text-sm" style={{ color: "var(--ink-soft)", marginTop: 6 }}>Android apps for you and your dietitians. Users get the Health365 app from the Play Store.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: "#0F1613", display: "grid", placeItems: "center", color: "#4EAA67", fontWeight: 800 }}>A</span>
              <span style={{ flex: 1, minWidth: 160 }}><b>{ADMIN_APP.name}</b> <span className="text-sm" style={{ color: "var(--ink-soft)" }}>· v{ADMIN_APP.version} · for you and your team</span></span>
              <a href={ADMIN_APP.url} download className="pill pill-outline" style={{ padding: "7px 14px", fontSize: ".82rem" }}>⬇️ Download</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/downloads/dietitian-icon.png" alt="" width={40} height={40} style={{ borderRadius: 11 }} />
              <span style={{ flex: 1, minWidth: 160 }}><b>{DIETITIAN_APP.name}</b> <span className="text-sm" style={{ color: "var(--ink-soft)" }}>· v{DIETITIAN_APP.version} · share with joined dietitians</span></span>
              <a href="/dietitian-app" target="_blank" className="pill pill-outline" style={{ padding: "7px 14px", fontSize: ".82rem" }}>Open page</a>
            </div>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Share this link with a dietitian: <b>thehealth365.in/dietitian-app</b> — it&apos;s also in their approval email.</p>
          </div>
        </div>

        {wa && (() => {
          const st: [string, string, string] = !wa.configured
            ? ["Not set up", "var(--ink-soft)", "Add your WhatsApp Business keys in Vercel to start sending welcome, booking and plan messages to users."]
            : wa.failedToday > 0 && (!wa.lastOk || (wa.lastError && wa.lastError.at > wa.lastOk.at))
              ? ["Errors", "var(--terracotta)", `Last error: ${wa.lastError?.error || "unknown"} (template: ${wa.lastError?.template || "—"})`]
              : ["Working", "#2E7D4F", wa.lastOk ? `Last message sent ${new Date(wa.lastOk.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}` : "Ready — no messages sent yet."];
          return (
            <div className="panel" style={{ marginBottom: 24, borderColor: st[0] === "Errors" ? "var(--terracotta)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.2rem" }}>WhatsApp messages to users</h2>
                <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "5px 11px", borderRadius: 100, color: "#fff", background: st[1] }}>{st[0]}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--ink-soft)", marginTop: 8, overflowWrap: "anywhere" }}>{st[2]}</p>
              {wa.configured && <p className="text-sm" style={{ marginTop: 6 }}><b>{wa.sentToday}</b> sent today · <b>{wa.failedToday}</b> failed</p>}
            </div>
          );
        })()}

        <div className="panel" style={{ marginBottom: 24, borderColor: scanStatus[1] === "var(--terracotta)" ? "var(--terracotta)" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.2rem" }}>Food scanner (AI)</h2>
            <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "5px 11px", borderRadius: 100, color: "#fff", background: scanStatus[1] }}>{scanStatus[0]}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--ink-soft)", marginTop: 8 }}>{scanStatus[2]}</p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14, fontSize: ".9rem" }}>
            <div><b>{scan.today.ok}</b> scans today</div>
            <div><b>{scan.today.fail}</b> failed</div>
            <div><b>{scan.today.quota}</b> hit the limit</div>
            <div>Last success: <b>{when(scan.lastOk)}</b></div>
          </div>
          {scan.lastError && (
            <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 10, wordBreak: "break-word" }}>
              Last error ({when(scan.lastError.at)}): {scan.lastError.detail || scan.lastError.outcome}
            </p>
          )}
          <p style={{ fontSize: ".78rem", marginTop: 10 }}>
            Check usage &amp; limits: <a href="https://aistudio.google.com/usage" target="_blank" rel="noreferrer">Google AI Studio → Usage</a>
          </p>
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
                  <span style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>{u.phone ? `📞 ${u.phone}` : "—"}</span>
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
