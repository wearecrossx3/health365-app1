import { requireAdminPage } from "@/lib/adminGuard";
import MyClients from "./MyClients";

export const dynamic = "force-dynamic";

export default async function MyClientsPage() {
  await requireAdminPage("my-clients");
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "40px 20px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <span className="eyebrow">Dietitian portal</span>
        <h1 style={{ fontSize: "1.9rem" }}>My clients</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: ".92rem", maxWidth: 640 }}>
          Your Health365 consultations happen here, in chat. Clients&apos; phone numbers and emails are private, and contact details typed in chat are hidden automatically.
        </p>
        <MyClients />
      </div>
    </main>
  );
}
