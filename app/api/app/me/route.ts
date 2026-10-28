import { NextRequest } from "next/server";
import { getUserById, getConsultationsForUser, getAppointmentsForUser, setUserPhone } from "@/lib/kv";
import { appJson, appPreflight, getAppSession } from "@/lib/appApi";
import { createSessionCookieValue } from "@/lib/session";

// The signed-in user's own data: profile, saved consultations (newest
// first) and appointments — so a user who fills the consultation on the
// website sees it in the app, and the other way round.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  try {
    const [user, consultations, appointments] = await Promise.all([
      getUserById(session.userId),
      getConsultationsForUser(session.userId),
      getAppointmentsForUser(session.userId),
    ]);
    if (!user) return appJson({ error: "Account not found.", code: "auth" }, 401);
    consultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    appointments.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
    return appJson({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone || "", google: !!user.google },
      // a fresh 30-day login every time the app opens, so active users are never logged out
      token: createSessionCookieValue({ userId: user.id, email: user.email, name: user.name }),
      consultations: consultations.slice(0, 10),
      appointments,
    });
  } catch (err) {
    console.error("App /me failed:", err);
    return appJson({ error: "Couldn't load your account right now." }, 500);
  }
}

// Add or change the mobile number later (for people who skipped it or used Google).
export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const b = await req.json().catch(() => null);
  if (!b || typeof b.phone !== "string") return appJson({ error: "Nothing to save." }, 400);
  const r = await setUserPhone(session.userId, b.phone);
  if (!r.ok) return appJson({ error: r.error, code: "phone" }, 400);
  return appJson({ ok: true, phone: r.phone });
}
