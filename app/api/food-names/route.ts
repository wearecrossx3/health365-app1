import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminGuard";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { LANGS, foodNamesFor } from "@/lib/foodNames";

// Food names (and serving words) in the client's language, for the plan
// builder: type in English, pick the Gujarati / Hindi name.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const ok = (await adminFromRequest(req, "users")) || (await dietitianFromRequest(req));
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const lang = String(req.nextUrl.searchParams.get("lang") || "");
  if (!LANGS[lang]) return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  try {
    return NextResponse.json(await foodNamesFor(lang));
  } catch (e) {
    console.error("food-names failed", e);
    return NextResponse.json({ error: "Couldn't load the names right now." }, { status: 502 });
  }
}
