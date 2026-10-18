import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";
import { recordPing } from "@/lib/insights";

// The app says "I'm open" once per launch — feeds the admin Insights page.
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function POST(req: NextRequest) {
  const limited = await limit(req, "ping", 60, 3600);
  if (limited) return limited;
  const b = await req.json().catch(() => ({}));
  const did = str(b?.did, 40).replace(/[^a-zA-Z0-9-]/g, "");
  if (!did) return appJson({ ok: false }, 400);
  const s = getAppSession(req);
  await recordPing(did, s?.userId || "", str(b?.version, 12)).catch(() => {});
  return appJson({ ok: true });
}
