import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { createAppointment, getAppointmentsForUser, isSlotTaken } from "@/lib/kv";

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
