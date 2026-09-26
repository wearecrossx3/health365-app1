import { NextRequest } from "next/server";
import crypto from "crypto";
import { getUserByEmail, createUser } from "@/lib/kv";
import { hashPassword } from "@/lib/auth";
import { createSessionCookieValue } from "@/lib/session";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { isValidPhone } from "@/lib/phone";
import { appJson, appPreflight, limit, str } from "@/lib/appApi";

// Same account as the website — someone who signs up in the app can log
// in on the site with the same email/password, and vice versa.
export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-signup", 10, 3600);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const name = str(body?.name, 80);
  const email = str(body?.email, 120).toLowerCase();
  const phone = str(body?.phone, 20);
  const password = String(body?.password ?? "");

  if (!name || !email || !password) return appJson({ error: "Name, email, and password are required." }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return appJson({ error: "Please enter a valid email address." }, 400);
  if (password.length < 8) return appJson({ error: "Password must be at least 8 characters." }, 400);
  if (phone && !isValidPhone(phone)) return appJson({ error: "Please enter a valid phone number." }, 400);

  try {
    if (await getUserByEmail(email)) {
      return appJson({ error: "An account with this email already exists. Please log in.", code: "exists" }, 409);
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      phone: phone || undefined,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await createUser(user);

    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: `New Health365 member (app): ${user.name}`,
        html: emailWrapper(
          "New member joined from the app",
          `<p><b>Name:</b> ${user.name.replace(/</g, "&lt;")}<br/><b>Email:</b> ${user.email}<br/><b>Phone:</b> ${phone || "—"}</p>`
        ),
      }).catch(() => {});
    }
    sendPushToAdmins({ title: "New member joined (app)", body: `${user.name} — ${user.email}`, url: "/admin" }).catch(() => {});
    if (user.phone) {
      sendWhatsAppTemplate({
        to: user.phone,
        templateName: process.env.WHATSAPP_TEMPLATE_WELCOME || "health365_welcome",
        bodyParams: [user.name],
      }).catch(() => {});
    }

    const token = createSessionCookieValue({ userId: user.id, email: user.email, name: user.name });
    return appJson({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone || "" } });
  } catch (err) {
    console.error("App signup failed:", err);
    return appJson({ error: "Couldn't create your account right now — please try again." }, 500);
  }
}
