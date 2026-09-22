import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { saveContactMessage } from "@/lib/kv";
import { sendPushToAdmins } from "@/lib/push";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, message } = body || {};
  if (!message || !String(message).trim()) {
    return NextResponse.json({ error: "Please write a message." }, { status: 400 });
  }

  const safeName = name ? String(name) : "Website visitor";
  const safeEmail = email ? String(email) : "";

  await saveContactMessage({
    id: crypto.randomUUID(),
    name: safeName,
    email: safeEmail,
    message: String(message),
    source: "chat_widget",
    read: false,
    createdAt: new Date().toISOString(),
  }).catch(() => {});

  const admins = getAdminEmails();
  if (admins.length > 0) {
    await sendEmail({
      to: admins,
      subject: `New chat message from ${safeName}`,
      html: emailWrapper(
        "New message from the site chat widget",
        `<p><b>${safeName}</b>${safeEmail ? ` (${safeEmail})` : " (no email given)"}</p><p style="white-space:pre-wrap;">${String(message).replace(/</g, "&lt;")}</p>`
      ),
    }).catch(() => {});
  }

  sendPushToAdmins({ title: `New chat from ${safeName}`, body: String(message).slice(0, 120), url: "/admin/messages" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
