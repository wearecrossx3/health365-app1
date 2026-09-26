import { NextRequest } from "next/server";
import crypto from "crypto";
import { saveConsultation } from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";

// Saves the app's onboarding answers as a normal consultation, so it shows
// up in /admin exactly like one submitted from the website's
// /consultation page (same fields in `raw`), plus source: "mobile_app".
const HIGH_RISK = ["Diabetes", "PCOS", "Thyroid", "Hypertension", "Heart condition", "Kidney condition", "Cancer / Oncology", "Pregnant / breastfeeding"];

export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "app-consult", 20, 3600);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.goal || !body?.dietType) return appJson({ error: "Missing required consultation fields." }, 400);

  const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 20).map((x) => str(x, 60)).filter(Boolean) : []);
  const conditions = list(body.conditions);
  const raw = {
    fullName: str(body.fullName, 80),
    phone: str(body.phone, 20),
    email: str(body.email, 120),
    age: str(body.age, 3),
    gender: str(body.gender, 20),
    height: str(body.height, 5),
    weight: str(body.weight, 6),
    activity: str(body.activity, 30),
    goal: str(body.goal, 60),
    dietType: str(body.dietType, 30),
    allergens: list(body.allergens),
    conditions,
    otherCondition: str(body.otherCondition, 120),
    source: "mobile_app",
  };
  const needsReview = conditions.some((c) => HIGH_RISK.includes(c));

  try {
    const consultation = {
      id: crypto.randomUUID(),
      userId: session.userId,
      goal: raw.goal,
      dietType: raw.dietType,
      allergens: raw.allergens,
      conditions,
      raw,
      createdAt: new Date().toISOString(),
      status: "submitted" as const,
    };
    await saveConsultation(consultation);

    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: needsReview ? "⚠️ New app consultation — needs review" : "New app consultation",
        html: emailWrapper(
          needsReview ? "New consultation from the app — flagged for review" : "New consultation from the app",
          `<p><b>${raw.fullName.replace(/</g, "&lt;")}</b> · ${raw.phone}</p>
           <p><b>Goal:</b> ${raw.goal}<br/><b>Diet:</b> ${raw.dietType}<br/><b>Conditions:</b> ${conditions.join(", ") || "none"}</p>
           <p>${adminLink("/admin")}</p>`
        ),
      }).catch(() => {});
    }
    sendPushToAdmins({
      title: needsReview ? "⚠️ App consultation — needs review" : "New app consultation",
      body: `${raw.fullName} · ${raw.goal}`,
      url: "/admin",
    }).catch(() => {});

    return appJson({ ok: true, consultationId: consultation.id, needsProfessionalReview: needsReview });
  } catch (err) {
    console.error("App consultation failed:", err);
    return appJson({ error: "Couldn't save right now — please try again." }, 500);
  }
}
