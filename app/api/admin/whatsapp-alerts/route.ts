import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAccess } from "@/lib/admin";
import { listAlertPhones, saveAlertPhones, alertHealth, cleanPhone, sendAdminWhatsApp } from "@/lib/adminWhatsApp";

export const dynamic = "force-dynamic";

// Admin → Dashboard → "WhatsApp alerts to me (free)": add/remove the phones
// that get CallMeBot alerts, and send a test.
async function guard(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  return access.allowed && access.permissions.includes("dashboard");
}
const mask = (k: string) => (k.length > 3 ? "•••" + k.slice(-3) : "•••");

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const [list, health] = await Promise.all([listAlertPhones(), alertHealth()]);
  return NextResponse.json({ phones: list.map((p) => ({ phone: p.phone, name: p.name, key: mask(p.apikey) })), health });
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const list = await listAlertPhones();

  if (b.action === "add") {
    const phone = cleanPhone(b.phone);
    const apikey = String(b.apikey || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
    const name = String(b.name || "").trim().slice(0, 40);
    if (phone.length < 11 || phone.length > 15) return NextResponse.json({ error: "Enter the WhatsApp number with country code, e.g. 9198XXXXXXXX." }, { status: 400 });
    if (apikey.length < 4) return NextResponse.json({ error: "Paste the API key CallMeBot sent you on WhatsApp." }, { status: 400 });
    const next = list.filter((p) => p.phone !== phone);
    if (next.length >= 5) return NextResponse.json({ error: "You can add up to 5 numbers." }, { status: 400 });
    next.push({ phone, apikey, name, addedAt: new Date().toISOString() });
    await saveAlertPhones(next);
    const r = await sendAdminWhatsApp("✅ *Health365 alerts are on*\nYou'll get a WhatsApp here when someone joins, books or sends a consultation.", phone);
    return NextResponse.json({ ok: true, tested: r.sent > 0, error: r.errors[0] || "" });
  }
  if (b.action === "remove") {
    await saveAlertPhones(list.filter((p) => p.phone !== cleanPhone(b.phone)));
    return NextResponse.json({ ok: true });
  }
  if (b.action === "test") {
    if (!list.length) return NextResponse.json({ error: "Add a number first." }, { status: 400 });
    const r = await sendAdminWhatsApp("🔔 *Test alert*\nHealth365 WhatsApp alerts are working.");
    return NextResponse.json({ ok: r.sent > 0, sent: r.sent, error: r.errors[0] || "" });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
