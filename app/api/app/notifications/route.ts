import { NextRequest } from "next/server";
import { listAppNotifications } from "@/lib/kv";
import { appJson, appPreflight, limit } from "@/lib/appApi";

// Public feed the Android app checks in the background (~every 30 min).
// ?since=<ms timestamp> returns only messages newer than that. The phone
// decides by itself which ones apply to its user (audience field), so
// nothing personal is sent here.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const limited = await limit(req, "app-notifs", 120, 3600);
  if (limited) return limited;
  const since = Number(req.nextUrl.searchParams.get("since")) || 0;
  const all = await listAppNotifications().catch(() => []);
  const notifications = all
    .filter((n) => Date.parse(n.createdAt) > since)
    .slice(0, 10)
    .map(({ id, title, body, audience, createdAt }) => ({ id, title, body, audience, at: Date.parse(createdAt) }));
  return appJson({ notifications, now: Date.now() });
}
