import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";
import { dietitianStatus, makeHandoff } from "@/lib/portalHandoff";
import { siteUrl } from "@/lib/ratings";

// Main app → dietitian portal.
//   GET  → { dietitian: { status, portal } }
//   POST → { url } a one-time link that opens the portal (approved) or the join form (not yet approved)
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  return appJson({ dietitian: await dietitianStatus(s.userId) });
}

export async function POST(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "portal-handoff", 30, 3600);
  if (limited) return limited;
  const st = await dietitianStatus(s.userId);
  const to = st.portal ? "portal" : "join";
  const code = await makeHandoff(s.userId, to);
  return appJson({ ok: true, to, dietitian: st, url: `${siteUrl()}/api/auth/portal?code=${code}` });
}
