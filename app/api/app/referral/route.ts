import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession } from "@/lib/appApi";
import { getOrCreateCode, referralStats } from "@/lib/referral";

// The signed-in user's invite code and how many friends joined with it.
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  try {
    const code = await getOrCreateCode(s.userId, s.name);
    const st = await referralStats(s.userId);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "www.thehealth365.in";
    return appJson({ code, link: `https://${host}/r/${code}`, ...st });
  } catch (err) {
    console.error("Referral failed:", err);
    return appJson({ error: "Couldn't load right now." }, 500);
  }
}
