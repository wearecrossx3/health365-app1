import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import { listAdminEvents } from "@/lib/kv";

// Polled by the Health365 Admin Android app in the background (it sends the
// admin's own login cookie). Returns new admin alerts since ?since=<ms>,
// only for sections this admin is allowed to see.
export const dynamic = "force-dynamic";

// Which permission each alert link belongs to (longest match wins).
const SECTION: [string, string][] = [
  ["/admin/messages", "messages"],
  ["/admin/testimonials", "testimonials"],
  ["/admin/diet-plans", "diet-plans"],
  ["/admin/app-notifications", "app-notifications"],
  ["/admin/coupons", "coupons"],
  ["/admin/app-content", "app"],
  ["/admin/settings", "settings"],
  ["/admin/content", "content"],
  ["/admin/media", "media"],
  ["/admin", "dashboard"],
];

export async function GET(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.allowed) return NextResponse.json({ error: "Please log in again.", code: "auth" }, { status: 401 });
  const since = Number(req.nextUrl.searchParams.get("since")) || 0;
  const perms = access.permissions as string[];
  const events = (await listAdminEvents())
    .filter((e) => e.at > since)
    .filter((e) => {
      const hit = SECTION.find(([path]) => e.url === path || e.url.startsWith(path + "/") || e.url.startsWith(path + "?"));
      return !hit || perms.includes(hit[1]);
    })
    .slice(0, 10);
  return NextResponse.json({ events, now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
