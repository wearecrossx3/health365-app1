import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setDietitianStatus, getDietitianApplicationById, createOrUpdateDietitianApplication } from "@/lib/kv";
import { sendEmail, emailWrapper, adminLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!(await isAdmin(session, "dashboard"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  // Approve or turn down a dietitian's fee / qualification / experience change.
  if (body?.action === "changes") {
    const d = await getDietitianApplicationById(String(body.id || ""));
    if (!d?.pendingChanges) return NextResponse.json({ ok: true });
    const p = d.pendingChanges;
    if (body.decision === "approve") {
      if (p.qualification !== undefined) d.qualification = p.qualification;
      if (p.experienceYears !== undefined) d.experienceYears = p.experienceYears;
      if (p.fee !== undefined) d.fee = p.fee;
    }
    d.pendingChanges = undefined;
    await createOrUpdateDietitianApplication(d);
    sendEmail({
      to: d.email,
      subject: body.decision === "approve" ? "Your Health365 profile is updated" : "About your Health365 profile change",
      html: emailWrapper(
        body.decision === "approve" ? "Profile updated" : "Profile change not approved",
        body.decision === "approve"
          ? `<p>Hi ${d.name}, your changes are now live on Health365.</p>`
          : `<p>Hi ${d.name}, we couldn't approve your latest change to your fee, qualification or experience. Write to health365.support@gmail.com if you have questions.</p>`
      ),
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (!body?.id || !["approved", "rejected", "pending"].includes(body?.status)) {
    return NextResponse.json({ error: "Missing id or invalid status." }, { status: 400 });
  }
  await setDietitianStatus(body.id, body.status);

  if (body.status === "approved" || body.status === "rejected") {
    const app = await getDietitianApplicationById(body.id);
    if (app) {
      sendEmail({
        to: app.email,
        subject: body.status === "approved" ? "You're approved on Health365 🎉" : "Your Health365 application",
        html: emailWrapper(
          body.status === "approved" ? "You're approved!" : "Application update",
          body.status === "approved"
            ? `<p>Great news, ${app.name} — your dietitian profile is now live in the Health365 directory.</p>
               <p>Clients who book you will chat with you inside Health365. Get the <b>Health365 Dietitian app</b> to reply to them and send diet plans: ${adminLink("/dietitian-app")}</p>
               <p>Log in with your Health365 email and password (or on a computer at ${adminLink("/admin/login")}).</p>`
            : `<p>Hi ${app.name}, your application wasn't approved this time. Feel free to reach out if you'd like to update your details and reapply.</p>`
        ),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
