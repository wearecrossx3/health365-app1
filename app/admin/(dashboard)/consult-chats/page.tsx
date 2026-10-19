import { requireAdminPage } from "@/lib/adminGuard";
import ConsultChats from "./ConsultChats";

export const dynamic = "force-dynamic";

export default async function ConsultChatsPage() {
  await requireAdminPage("users");
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "40px 20px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <span className="eyebrow">Admin</span>
        <h1 style={{ fontSize: "1.9rem" }}>Consult chats</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: ".92rem", maxWidth: 680 }}>
          Every chat between clients and joined dietitians. Messages where someone tried to share a phone number, email or link are marked ⚠️ — you can see what they typed. Dr. Astha&apos;s consultations stay on call and don&apos;t appear here.
        </p>
        <ConsultChats />
      </div>
    </main>
  );
}
