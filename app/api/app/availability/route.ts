import { NextRequest } from "next/server";
import { getAppointmentsForDietitian } from "@/lib/kv";
import { appJson, appPreflight } from "@/lib/appApi";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const dietitianId = req.nextUrl.searchParams.get("dietitianId");
  const date = req.nextUrl.searchParams.get("date");
  if (!dietitianId || !date) return appJson({ takenTimes: [] });
  try {
    const appts = await getAppointmentsForDietitian(dietitianId);
    return appJson({ takenTimes: appts.filter((a) => a.status === "booked" && a.date === date).map((a) => a.time) });
  } catch {
    return appJson({ takenTimes: [] });
  }
}
