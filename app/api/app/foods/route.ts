import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, appPreflight } from "@/lib/appApi";
import { getFoodDatabase } from "@/lib/foods";

// Calorie-counter database for the app (ingredients + everyday dishes,
// plus admin edits). The app keeps a copy on the phone and only downloads
// again when `version` changes (bootstrap tells it the current version).
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const db = await getFoodDatabase(false);
  const compact = req.nextUrl.searchParams.get("compact") === "1";
  const body = compact
    ? {
        version: db.version,
        source: db.source,
        // [id, name, aliases, group, kcal, protein, carbs, fat, fibre, per, serving]
        rows: [...db.dishes, ...db.foods].map((f) => [f.id, f.name, f.aliases || "", f.group, f.kcal, f.protein, f.carbs, f.fat, f.fibre, f.per, f.serving || ""]),
      }
    : db;
  return NextResponse.json(body, { headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=600" } });
}
