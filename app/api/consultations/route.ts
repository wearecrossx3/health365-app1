import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { saveConsultation, getConsultationsForUser } from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper, adminLink } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

// Conditions that should always be routed for professional review before
// any plan is shared — mirrors the pill "warn" flags in the Phase 2 UI.
const HIGH_RISK_CONDITIONS = [
  "Diabetes",
  "PCOS",
  "Thyroid",
  "Hypertension",
  "Heart condition",
  "Kidney condition",
  "Pregnant / breastfeeding",
];

export async function POST(req: NextRequest) {  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) {
    return NextResponse.json({ error: "Please sign in before submitting a consultation." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.goal || !body.dietType) {
    return NextResponse.json({ error: "Missing required consultation fields." }, { status: 400 });
  }

  const conditions: string[] = Array.isArray(body.conditions) ? body.conditions : [];
  const needsReview = conditions.some((c) => HIGH_RISK_CONDITIONS.includes(c));

  const consultation = {
    id: crypto.randomUUID(),
    userId: session.userId,
    goal: String(body.goal),
    dietType: String(body.dietType),
    allergens: Array.isArray(body.allergens) ? body.allergens : [],
    conditions,
    raw: body,
    createdAt: new Date().toISOString(),
    status: "submitted" as const,
  };

  await saveConsultation(consultation);

  const admins = getAdminEmails();
  if (admins.length > 0) {
    sendEmail({
      to: admins,
      subject: needsReview ? "⚠️ New consultation — needs review" : "New consultation submitted",
      html: emailWrapper(
        needsReview ? "New consultation — flagged for review" : "New consultation submitted",
        `<p><b>Goal:</b> ${consultation.goal}</p>
         <p><b>Diet type:</b> ${consultation.dietType}</p>
         <p><b>Allergens:</b> ${consultation.allergens.join(", ") || "none"}</p>
         <p><b>Conditions:</b> ${consultation.conditions.join(", ") || "none"}</p>
         <p style="margin-top:16px;">Check the admin dashboard for full details: ${adminLink("/admin")}</p>`
      ),
    }).catch(() => {});
  }

  sendPushToAdmins({
    title: needsReview ? "⚠️ New consultation — needs review" : "New consultation submitted",
    body: `${consultation.goal} · ${consultation.dietType}`,
    url: "/admin",
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    consultationId: consultation.id,
    needsProfessionalReview: needsReview,
  });
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const consultations = await getConsultationsForUser(session.userId);
  return NextResponse.json({ consultations });
}
