import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setDietitianStatus, getDietitianApplicationById, createOrUpdateDietitianApplication } from "@/lib/kv";
import { sendEmail, sendEmailResult, emailWrapper, adminLink } from "@/lib/email";
import { addNotice } from "@/lib/dietitianNotices";
import { fillDtMessage, DT_MESSAGES } from "@/lib/dietitianMessages";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!(await isAdmin(session, "dashboard"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  // A message from the team to one or more dietitians: in the Dietitian app
  // (pop-up + phone notification) and/or by email.
  if (body?.action === "message") {
    const ids: string[] = (Array.isArray(body.ids) ? body.ids : [body.id]).map(String).slice(0, 200);
    const title = String(body.title || "").trim().slice(0, 120);
    const text = String(body.body || "").trim().slice(0, 1500);
    if (!title || !text) return NextResponse.json({ error: "Write a title and a message." }, { status: 400 });
    let sent = 0, emailed = 0;
    let emailError = "";
    for (const id of ids) {
      const d = await getDietitianApplicationById(id);
      if (!d) continue;
      const t = fillDtMessage(title, d.name), b = fillDtMessage(text, d.name);
      if (body.app !== false) await addNotice(d.id, { title: t, body: b });
      if (body.email) {
        const html = b.split(/\n+/).map((x) => `<p>${x.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</p>`).join("");
        const r = await sendEmailResult({ to: d.email, subject: t, html: emailWrapper(t, html) }).catch(() => ({ ok: false, error: "Couldn't reach the email service." }));
        if (r.ok) emailed++;
        else if (!emailError) emailError = `${d.name}${d.email ? ` (${d.email})` : ""}: ${r.error || "email failed"}`;
      }
      sent++;
    }
    return NextResponse.json({ ok: true, sent, emailed, emailError });
  }
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
    if (app && body.status === "approved") {
      const w = DT_MESSAGES.find((m) => m.key === "approved")!;
      await addNotice(app.id, { title: fillDtMessage(w.title, app.name), body: fillDtMessage(w.body, app.name) }).catch(() => {});
    }
    if (app) {
      sendEmail({
        to: app.email,
        subject: body.status === "approved" ? "You're approved on Health365 🎉" : "Your Health365 application",
        html: emailWrapper(
          body.status === "approved" ? "You're approved!" : "Application update",
          body.status === "approved"
            ? `<p>Great news, ${app.name}! Your dietitian profile is now live on Health365.</p>
               <p><b>Next steps</b></p>
               <ol>
                 <li>Download the <b>H365 Dietitian app</b> (Android): ${adminLink("/dietitian-app")}<br>On iPhone or a computer, open ${adminLink("/admin/my-clients")} instead.</li>
                 <li>Log in with the same email and password as your Health365 account.</li>
                 <li>Read the Terms for dietitians and tap “I agree”.</li>
                 <li>Add your photo and a short bio in Me › Edit profile.</li>
               </ol>
               <p>Clients who book you will chat with you inside the app. Questions? Write to health365.support@gmail.com.</p>`
            : `<p>Hi ${app.name}, your application wasn't approved this time. Feel free to reach out if you'd like to update your details and reapply.</p>`
        ),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
