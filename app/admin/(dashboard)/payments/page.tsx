import { requireAdminPage } from "@/lib/adminGuard";
import { listAllAppointments, getUserById, getSiteContent } from "@/lib/kv";
import PaymentsList, { PayRow } from "./PaymentsList";

export const dynamic = "force-dynamic";

// Every booking paid by UPI, so the owner can match each UTR with the bank.
export default async function PaymentsPage() {
  await requireAdminPage("dashboard");
  const [all, c] = await Promise.all([listAllAppointments(), getSiteContent().catch(() => null)]);
  const paid = all.filter((a) => a.payment);
  const rows: PayRow[] = await Promise.all(
    paid.map(async (a) => {
      const u = await getUserById(a.userId).catch(() => null);
      return {
        id: a.id, client: a.userName, phone: u?.phone || "", dietitian: a.dietitianName,
        date: a.date, time: a.time, bookedAt: a.createdAt, booking: a.status,
        amount: a.payment!.amount, utr: a.payment!.utr, status: a.payment!.status,
        checkedAt: a.payment!.checkedAt || "", checkedBy: a.payment!.checkedBy || "",
      };
    })
  );
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "40px 20px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <span className="eyebrow">Admin</span>
        <h1 style={{ fontSize: "1.9rem" }}>Payments</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: ".92rem", maxWidth: 700 }}>
          Every consultation paid by UPI. Open the bank or UPI app for <b>{c?.premiumUpiId || "your UPI ID"}</b>, find the payment with the same UTR and amount, then tap <b>Received</b>. If there is no such payment, tap <b>Not received</b>: the booking is cancelled and the client and dietitian are told in the chat.
        </p>
        <PaymentsList rows={rows} />
      </div>
    </main>
  );
}
