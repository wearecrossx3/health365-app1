import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { createAppointment, getAppointmentsForUser, isSlotTaken } from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { dietitianId, dietitianName, date, time } = body || {};
  if (!dietitianId || !dietitianName || !date || !time) {
    return NextResponse.json({ error: "Missing booking details." }, { status: 400 });
  }

  try {
    const taken = await isSlotTaken(dietitianId, date, time);
    if (taken) {
      return NextResponse.json({ error: "That slot was just booked — please pick another." }, { status: 409 });
    }

    const appointment = {
      id: crypto.randomUUID(),
      userId: session.userId,
      userName: session.name,
      dietitianId: String(dietitianId),
      dietitianName: String(dietitianName),
      date: String(date),
      time: String(time),
      status: "booked" as const,
      createdAt: new Date().toISOString(),
    };
    await createAppointment(appointment);

    const prettyDate = new Date(appointment.date).toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long",
    });

    sendEmail({
      to: session.email,
      subject: `Your appointment with ${appointment.dietitianName} is confirmed`,
      html: emailWrapper(
        "Appointment confirmed",
        `<p>You're booked with <b>${appointment.dietitianName}</b> on <b>${prettyDate}</b> at <b>${appointment.time}</b>.</p>
         <p>You can view or manage this anytime from your <a href="${adminLink("/dashboard")}">dashboard</a>.</p>`
      ),
    }).catch(() => {});

    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: "New appointment booked",
        html: emailWrapper(
          "New appointment booked",
          `<p><b>${session.name}</b> booked with <b>${appointment.dietitianName}</b></p>
           <p>${prettyDate} at ${appointment.time}</p>
           <p style="margin-top:16px;">Admin dashboard: ${adminLink("/admin")}</p>`
        ),
      }).catch(() => {});
    }

    sendPushToAdmins({
      title: "New appointment booked",
      body: `${session.name} with ${appointment.dietitianName} — ${prettyDate} at ${appointment.time}`,
      url: "/admin",
    }).catch(() => {});

    return NextResponse.json({ ok: true, appointment });
  } catch (err) {
    console.error("Booking failed:", err);
    return NextResponse.json(
      { error: "Couldn't book your appointment — the database isn't connected. Check Redis setup." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) return NextResponse.json({ appointments: [] });
  const appointments = await getAppointmentsForUser(session.userId);
  return NextResponse.json({ appointments });
}
