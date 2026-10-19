import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import { sendPushToAdmins } from "@/lib/push";

export const dynamic = "force-dynamic";

// "Send test notification" on the admin dashboard — goes to the Admin app
// (and any browsers with notifications on), so the owner can check alerts work.
export async function POST(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.allowed || !session || access.dietitianId) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  await sendPushToAdmins({
    title: "🔔 Test alert",
    body: `Admin notifications are working. (sent by ${session.name || session.email})`,
    url: "/admin",
  });
  return NextResponse.json({ ok: true });
}
