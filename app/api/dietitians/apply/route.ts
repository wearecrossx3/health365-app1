import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import {
  createOrUpdateDietitianApplication,
  getDietitianApplicationByUserId,
  DietitianApplication,
} from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.qualification || !body?.location) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const existing = await getDietitianApplicationByUserId(session.userId);
    const app: DietitianApplication = {
      id: existing?.id || crypto.randomUUID(),
      userId: session.userId,
      name: session.name,
      email: session.email,
      qualification: String(body.qualification),
      experienceYears: Number(body.experienceYears) || 0,
      specializations: Array.isArray(body.specializations) ? body.specializations : [],
      languages: Array.isArray(body.languages) ? body.languages : [],
      location: String(body.location),
      fee: String(body.fee || ""),
      about: String(body.about || ""),
      status: "pending",
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await createOrUpdateDietitianApplication(app);

    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: "New dietitian application",
        html: emailWrapper(
          "New dietitian application",
          `<p><b>${app.name}</b> (${app.email})</p>
           <p>${app.qualification} · ${app.experienceYears} yrs · ${app.location}</p>
           <p>Specializations: ${app.specializations.join(", ") || "none"}</p>
           <p style="margin-top:16px;">Review it here: ${adminLink("/admin")}</p>`
        ),
      }).catch(() => {});
    }

    if (!existing) {
      sendPushToAdmins({
        title: "New dietitian application",
        body: `${app.name} — ${app.qualification}, ${app.location}`,
        url: "/admin",
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dietitian application failed:", err);
    return NextResponse.json(
      { error: "Couldn't submit your application — the database isn't connected. Check Redis setup." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) return NextResponse.json({ application: null });
  const app = await getDietitianApplicationByUserId(session.userId);
  return NextResponse.json({ application: app });
}
