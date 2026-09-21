import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAllContactMessages } from "@/lib/kv";
import MessagesManager from "./MessagesManager";

export default async function AdminMessagesPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(session)) redirect("/admin/login");

  const messages = await listAllContactMessages();

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 780, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Messages</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Everything sent through the Contact page form or the chat bubble on the site lands here — you&apos;re also emailed a copy of each one.
          </p>
        </div>
        <MessagesManager initial={messages} />
      </div>
    </main>
  );
}
