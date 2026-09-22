import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { saveContactMessage } from "@/lib/kv";
import { sendPushToAdmins } from "@/lib/push";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, message } = body || {};
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

  await saveContactMessage({
    id: crypto.randomUUID(),
    name: String(name),
    email: String(email),
    message: String(message),
    source: "contact_form",
    read: false,
    createdAt: new Date().toISOString(),
  }).catch(() => {});

  const admins = getAdminEmails();
  if (admins.length > 0) {
    await sendEmail({
      to: admins,
      subject: `New contact message from ${name}`,
      html: emailWrapper(
        "New contact message",
        `<p><b>${name}</b> (${email})</p><p style="white-space:pre-wrap;">${String(message).replace(/</g, "&lt;")}</p>`
      ),
    }).catch(() => {});
  }

  sendPushToAdmins({ title: `New message from ${name}`, body: String(message).slice(0, 120), url: "/admin/messages" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
