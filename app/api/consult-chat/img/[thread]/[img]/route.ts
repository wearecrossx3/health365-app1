import { NextRequest, NextResponse } from "next/server";
import { getAppSession, appPreflight } from "@/lib/appApi";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import { getAppt, isChatAppointment, threadHasImage, loadImage } from "@/lib/consultChat";

// Chat photos are private: only the client, that appointment's dietitian, or
// the owner/team (Users permission) can load them.
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest, { params }: { params: { thread: string; img: string } }) {
  const a = await getAppt(params.thread);
  if (!a || !isChatAppointment(a)) return new NextResponse("Not found", { status: 404 });
  let ok = false;
  const client = getAppSession(req);
  if (client && client.userId === a.userId) ok = true;
  if (!ok) {
    const access = await getAdminAccess(verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value));
    ok = access.dietitianId ? access.dietitianId === a.dietitianId : access.permissions.includes("users");
  }
  if (!ok || !(await threadHasImage(a.id, params.img))) return new NextResponse("Not found", { status: 404 });
  const img = await loadImage(params.img);
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(img.body), {
    headers: { "Content-Type": img.type, "Cache-Control": "private, max-age=86400", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization" },
  });
}
