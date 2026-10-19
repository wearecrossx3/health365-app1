import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { getAppt, isChatAppointment, chatOpen, firstName } from "@/lib/consultChat";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ClientChat from "./ClientChat";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = verifySessionCookieValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/login");
  const a = await getAppt(params.id);
  if (!a || a.userId !== session.userId || !isChatAppointment(a)) notFound();
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--paper)" }}>
        <div className="wrap" style={{ maxWidth: 720, paddingTop: 36, paddingBottom: 80 }}>
          <Link href="/dashboard" style={{ fontSize: ".9rem", color: "var(--teal-deep)" }}>← Dashboard</Link>
          <h1 style={{ fontSize: "1.6rem", marginTop: 10 }}>{a.dietitianName}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", margin: "4px 0 16px" }}>
            Your consultation happens here in chat. Share your reports and questions — your dietitian replies here. For your privacy, phone numbers and emails are hidden.
          </p>
          <ClientChat id={a.id} open={chatOpen(a)} names={{ client: firstName(a.userName), dietitian: a.dietitianName }} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
