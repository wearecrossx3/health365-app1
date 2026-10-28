import { NextResponse } from "next/server";
import { listApprovedDietitians } from "@/lib/kv";
import { ratingsFor } from "@/lib/ratings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Public list: never send email, user id or internal fields.
    const dietitians = await Promise.all((await listApprovedDietitians()).map(async (d) => {
      // Stars show publicly only once 3 or more clients have rated.
      const r = await ratingsFor(d.id).catch(() => ({ avg: 0, count: 0 }));
      return {
        id: d.id, name: d.name, qualification: d.qualification, experienceYears: d.experienceYears,
        specializations: d.specializations, languages: d.languages, location: d.location,
        about: d.about, fee: d.fee, photoUrl: d.photoUrl || "",
        rating: r.count >= 3 ? { avg: r.avg, count: r.count } : null,
      };
    }));
    return NextResponse.json({ dietitians });
  } catch (err) {
    console.error("Failed to load dietitians:", err);
    return NextResponse.json({ dietitians: [] });
  }
}
