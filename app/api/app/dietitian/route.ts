import { NextRequest } from "next/server";
import crypto from "crypto";
import {
  createOrUpdateDietitianApplication,
  getDietitianApplicationByUserId,
  getAppointmentsForDietitian,
  DietitianApplication,
} from "@/lib/kv";
import { SPECIALIZATIONS } from "@/lib/dietConditions";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";

// "Join as a Dietitian" from inside the app. Same records as the website's
// /join-as-dietitian page: the application shows up in /admin for approval,
// and once approved the dietitian appears in the directory and in the app.
export const dynamic = "force-dynamic";

const LANGUAGES = ["English", "Hindi", "Gujarati"]; // same list as the website form and directory filter

export async function OPTIONS() {
  return appPreflight();
}

// Current application (if any) + the dietitian's upcoming bookings once approved.
export async function GET(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  try {
    const application = await getDietitianApplicationByUserId(session.userId);
    let appointments: { date: string; time: string; userName: string; status: string }[] = [];
    if (application?.status === "approved") {
      const today = new Date().toISOString().slice(0, 10);
      appointments = (await getAppointmentsForDietitian(application.id))
        .filter((a) => a.status === "booked" && a.date >= today)
        .sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
        .map((a) => ({ date: a.date, time: a.time, userName: a.userName, status: a.status }));
    }
    return appJson({ application, appointments, specializations: SPECIALIZATIONS, languages: LANGUAGES });
  } catch (err) {
    console.error("App dietitian GET failed:", err);
    return appJson({ error: "Couldn't load right now." }, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "app-dietitian", 10, 3600);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const qualification = str(body?.qualification, 120);
  const location = str(body?.location, 80);
  if (!qualification || !location) return appJson({ error: "Please add your qualification and location." }, 400);
  const pick = (v: unknown, allowed: string[]) =>
    Array.isArray(v) ? v.map((x) => String(x)).filter((x) => allowed.includes(x)).slice(0, 25) : [];

  try {
    const existing = await getDietitianApplicationByUserId(session.userId);
    if (existing?.status === "approved") {
      return appJson({ error: "You're already an approved dietitian. Contact us to change your profile." }, 409);
    }
    const application: DietitianApplication = {
      id: existing?.id || crypto.randomUUID(),
      userId: session.userId,
      name: session.name,
      email: session.email,
      qualification,
      experienceYears: Math.max(0, Math.min(60, Number(body?.experienceYears) || 0)),
      specializations: pick(body?.specializations, SPECIALIZATIONS),
      languages: pick(body?.languages, LANGUAGES),
      location,
      fee: str(body?.fee, 60),
      about: str(body?.about, 800),
      status: "pending",
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await createOrUpdateDietitianApplication(application);

    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: "New dietitian application (app)",
        html: emailWrapper(
          "New dietitian application from the app",
          `<p><b>${application.name.replace(/</g, "&lt;")}</b> (${application.email})</p>
           <p>${application.qualification.replace(/</g, "&lt;")} · ${application.experienceYears} yrs · ${application.location.replace(/</g, "&lt;")}</p>
           <p>Specializations: ${application.specializations.join(", ") || "none"}</p>
           <p style="margin-top:16px;">Review it here: ${adminLink("/admin")}</p>`
        ),
      }).catch(() => {});
    }
    if (!existing) {
      sendPushToAdmins({
        title: "New dietitian application",
        body: `${application.name} — ${application.qualification}, ${application.location}`,
        url: "/admin",
      }).catch(() => {});
    }
    return appJson({ ok: true, application });
  } catch (err) {
    console.error("App dietitian apply failed:", err);
    return appJson({ error: "Couldn't submit right now — please try again." }, 500);
  }
}
