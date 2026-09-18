import { NextResponse } from "next/server";
import { listAllConsultations, listAllAppointments } from "@/lib/kv";

// Deliberately exposes NO personal data — not names, not emails, not
// which specific person. Just "a consultation happened N minutes ago"
// style events, built from real records already in the database.
export async function GET() {
  try {
    const [consultations, appointments] = await Promise.all([
      listAllConsultations(),
      listAllAppointments(),
    ]);

    const events = [
      ...consultations.slice(0, 8).map((c) => ({
        type: "consultation" as const,
        goal: c.goal,
        createdAt: c.createdAt,
      })),
      ...appointments.slice(0, 8).map((a) => ({
        type: "appointment" as const,
        goal: null,
        createdAt: a.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
