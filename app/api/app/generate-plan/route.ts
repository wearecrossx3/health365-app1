import { NextRequest } from "next/server";
import { appJson, appPreflight, limit } from "@/lib/appApi";
import { generatePlan, parsePlanInput } from "@/lib/planGenerator";

// The app's plan builder. Same engine as Admin → Plan Generator, so a plan
// made in the app is a realistic Indian thali-style plan with calculated calories.
// (Who may open a 7-day plan is decided by /api/app/plans "claim".)
export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-generate", 40, 3600);
  if (limited) return limited;
  const b = await req.json().catch(() => null);
  try {
    return appJson({ ok: true, plan: generatePlan(parsePlanInput(b)) });
  } catch (err) {
    console.error("Plan generation failed:", err);
    return appJson({ error: "Couldn't build a plan right now." }, 500);
  }
}
