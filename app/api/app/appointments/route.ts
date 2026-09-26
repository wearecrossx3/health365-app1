import { NextRequest } from "next/server";
import crypto from "crypto";
import { createAppointment, getAppointmentsForUser, isSlotTaken, getUserById, saveContactMessage, getSiteContent } from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";

// Books a real slot — same records the website's BookingWidget creates,
// so it appears on the admin dashboard, the dietitian's dashboard and the
// user's website dashboard. When the app sends a UPI reference (admin has
// set a UPI ID + price in Settings), it ALSO files a "Paid request"
// message, exactly like the website's paid consultation flow.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ appointments: [] });
  const appointments = await getAppointmentsForUser(session.userId).catch(() => []);
  return appJson({ appointments });
}

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "app-book", 10, 3600);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const dietitianId = str(body?.dietitianId, 80);
  const dietitianName = str(body?.dietitianName, 80);
  const date = str(body?.date, 10);
  const time = str(body?.time, 10);
  const note = str(body?.note, 600);
  const reason = str(body?.reason, 80);
  const utr = str(body?.utr, 40);
  if (!dietitianId || !dietitianName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) {
    return appJson({ error: "Missing booking details." }, 400);
  }

  try {
    if (await isSlotTaken(dietitianId, date, time)) {
      return appJson({ error: "That slot was just booked — please pick another.", code: "taken" }, 409);
    }
    const user = await getUserById(session.userId);
    const appointment = {
      id: crypto.randomUUID(),
      userId: session.userId,
      userName: session.name,
      dietitianId,
      dietitianName,
      date,
      time,
      status: "booked" as const,
      createdAt: new Date().toISOString(),
    };
    await createAppointment(appointment);

    const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    if (utr) {
      const content = await getSiteContent();
      await saveContactMessage({
        id: crypto.randomUUID(),
        name: session.name,
        email: session.email,
        message:
          `Paid 1:1 consultation from the app (₹${content.premiumDiscountedPrice} via UPI).\n` +
          `Phone: ${user?.phone || "—"}\nUPI reference (UTR): ${utr}\n` +
          `Slot: ${prettyDate} at ${time} with ${dietitianName}\n` +
          (reason ? `For: ${reason}\n` : "") +
          (note ? `Note: ${note}\n` : "") +
          `Please verify the payment before confirming.`,
        source: "premium_consult",
        read: false,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    } else if (note) {
      await saveContactMessage({
        id: crypto.randomUUID(),
        name: session.name,
        email: session.email,
        message: `Booking note from the app — ${prettyDate} at ${time} with ${dietitianName}\n${reason ? `For: ${reason}\n` : ""}${note}`,
        source: "mobile_app",
        read: false,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    sendEmail({
      to: session.email,
      subject: `Your appointment with ${dietitianName} is ${utr ? "requested" : "confirmed"}`,
      html: emailWrapper(
        utr ? "Appointment requested" : "Appointment confirmed",
        `<p>${utr ? "We've received your request" : "You're booked"} with <b>${dietitianName}</b> on <b>${prettyDate}</b> at <b>${time}</b>.</p>`
      ),
    }).catch(() => {});
    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: utr ? "💰 New paid appointment (app)" : "New appointment booked (app)",
        html: emailWrapper(
          "New appointment from the app",
          `<p><b>${session.name.replace(/</g, "&lt;")}</b> booked with <b>${dietitianName}</b></p><p>${prettyDate} at ${time}</p>${utr ? `<p>UPI reference: <b>${utr.replace(/</g, "&lt;")}</b> — please verify.</p>` : ""}<p>${adminLink("/admin")}</p>`
        ),
      }).catch(() => {});
    }
    sendPushToAdmins({
      title: utr ? "💰 Paid appointment (app)" : "New appointment (app)",
      body: `${session.name} with ${dietitianName} — ${prettyDate} at ${time}`,
      url: utr ? "/admin/messages" : "/admin",
    }).catch(() => {});
    if (user?.phone) {
      sendWhatsAppTemplate({
        to: user.phone,
        templateName: process.env.WHATSAPP_TEMPLATE_APPOINTMENT || "health365_appointment_confirmed",
        bodyParams: [session.name, dietitianName, prettyDate, time],
      }).catch(() => {});
    }

    return appJson({ ok: true, appointment });
  } catch (err) {
    console.error("App booking failed:", err);
    return appJson({ error: "Couldn't book right now — please try again." }, 500);
  }
}
