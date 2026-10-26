import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { saveAppointment, getUserById } from "@/lib/kv";
import { getAppt, addMessage } from "@/lib/consultChat";
import { sendEmail, emailWrapper } from "@/lib/email";

// Owner checks a UPI payment against the bank / UPI app:
//   { id, decision: "verified" | "rejected" | "unverified" }
// Rejected = payment not received: the booking is cancelled and both the
// client and the dietitian see a note in the chat.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "dashboard");
  if (!session) return denied();
  const b = await req.json().catch(() => ({}));
  const a = await getAppt(String(b?.id || ""));
  if (!a?.payment) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const decision = b.decision;
  if (!["verified", "rejected", "unverified"].includes(decision)) return NextResponse.json({ error: "Unknown decision." }, { status: 400 });
  const was = a.payment.status;
  a.payment = { ...a.payment, status: decision, checkedAt: new Date().toISOString(), checkedBy: session.name || session.email };
  if (decision === "rejected") a.status = "cancelled";
  if (decision !== "rejected" && was === "rejected") a.status = "booked";
  await saveAppointment(a);

  if (decision === "verified" && was !== "verified") {
    await addMessage(a.id, "team", `✅ Payment of ₹${a.payment.amount} received. Your consultation is confirmed and the chat is now open.`).catch(() => {});
  }
  if (decision === "rejected" && was !== "rejected") {
    await addMessage(a.id, "team", `⚠️ We could not find a payment of ₹${a.payment.amount} with UTR ${a.payment.utr}. This booking is cancelled. If you did pay, write to health365.support@gmail.com with a screenshot of the payment.`).catch(() => {});
    const u = await getUserById(a.userId).catch(() => null);
    if (u?.email) {
      sendEmail({
        to: u.email,
        subject: "About your Health365 booking",
        html: emailWrapper("Payment not found", `<p>Hi ${String(a.userName || "").split(" ")[0]}, we could not find your payment of ₹${a.payment.amount} (UTR ${a.payment.utr}) for the consultation with ${a.dietitianName}, so the booking is cancelled.</p><p>If you did pay, reply to health365.support@gmail.com with a screenshot of the payment and we will fix it.</p>`),
      }).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true, payment: a.payment, status: a.status });
}
