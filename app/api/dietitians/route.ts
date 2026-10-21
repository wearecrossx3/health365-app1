import { NextResponse } from "next/server";
import { listApprovedDietitians } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Public list: never send email, user id or internal fields.
    const dietitians = (await listApprovedDietitians()).map((d) => ({
      id: d.id, name: d.name, qualification: d.qualification, experienceYears: d.experienceYears,
      specializations: d.specializations, languages: d.languages, location: d.location,
      about: d.about, fee: d.fee, photoUrl: d.photoUrl || "",
    }));
    return NextResponse.json({ dietitians });
  } catch (err) {
    console.error("Failed to load dietitians:", err);
    return NextResponse.json({ dietitians: [] });
  }
}
