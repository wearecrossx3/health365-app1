import { NextRequest, NextResponse } from "next/server";
import { getAppointmentsForDietitian } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const dietitianId = req.nextUrl.searchParams.get("dietitianId");
  const date = req.nextUrl.searchParams.get("date");
  if (!dietitianId || !date) {
    return NextResponse.json({ takenTimes: [] });
  }
  try {
    const appts = await getAppointmentsForDietitian(dietitianId);
    const takenTimes = appts
      .filter((a) => a.status === "booked" && a.date === date)
      .map((a) => a.time);
    return NextResponse.json({ takenTimes });
  } catch {
    return NextResponse.json({ takenTimes: [] });
  }
}
