import { NextRequest } from "next/server";
import crypto from "crypto";
import { saveContactMessage } from "@/lib/kv";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";

// "Talk to our care team" from the app → lands in /admin/messages with an
// "App" label. Works signed-in (name/email come from the account) or not.
export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-msg", 8, 3600);
  if (limited) return limited;
  const session = getAppSession(req);
  const body = await req.json().catch(() => null);
  const message = str(body?.message, 2000);
  if (!message) return appJson({ error: "Please write a message." }, 400);
  const name = session?.name || str(body?.name, 80) || "App user";
  const email = session?.email || str(body?.email, 120);
  const phone = str(body?.phone, 20);
  const full = phone ? `${message}\n\nPhone: ${phone}` : message;

  await saveContactMessage({
    id: crypto.randomUUID(),
    name,
    email,
    message: full,
    source: "mobile_app",
    read: false,
    createdAt: new Date().toISOString(),
  }).catch(() => {});

  const admins = getAdminEmails();
  if (admins.length > 0) {
    sendEmail({
      to: admins,
      subject: `New app message from ${name}`,
      html: emailWrapper("New message from the app", `<p><b>${name.replace(/</g, "&lt;")}</b> ${email ? `(${email})` : ""}</p><p style="white-space:pre-wrap;">${full.replace(/</g, "&lt;")}</p>`),
    }).catch(() => {});
  }
  sendPushToAdmins({ title: `App message from ${name}`, body: message.slice(0, 120), url: "/admin/messages" }).catch(() => {});
  return appJson({ ok: true });
}
