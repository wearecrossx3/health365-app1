import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, message } = body || {};
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

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

  return NextResponse.json({ ok: true });
}
