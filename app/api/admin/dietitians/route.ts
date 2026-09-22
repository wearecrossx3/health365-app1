import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setDietitianStatus, getDietitianApplicationById } from "@/lib/kv";
import { sendEmail, emailWrapper, adminLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!(await isAdmin(session, "dashboard"))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
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
               <p>View it here: ${adminLink("/dietitian-dashboard")}</p>`
            : `<p>Hi ${app.name}, your application wasn't approved this time. Feel free to reach out if you'd like to update your details and reapply.</p>`
        ),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
