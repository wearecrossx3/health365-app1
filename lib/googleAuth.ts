import crypto from "crypto";
import { redis, getUserByEmail, createUser, User } from "@/lib/kv";
import { hashPassword } from "@/lib/auth";
import { sendEmail, getAdminEmails, emailWrapper } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

// "Continue with Google" for the website and the app. Switched on by adding
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel (Google Cloud → OAuth client,
// type "Web application", redirect URI https://www.thehealth365.in/api/auth/google/callback).
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function googleAuthUrl(base: string, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${base}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function googleProfile(base: string, code: string): Promise<{ email: string; name: string } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) { console.error("Google token exchange failed:", await res.text()); return null; }
  const d = await res.json();
  // The id_token came straight from Google over HTTPS in exchange for our secret, so its contents can be trusted.
  const part = String(d.id_token || "").split(".")[1];
  if (!part) return null;
  const claims = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !claims.email || claims.email_verified === false) return null;
  return { email: String(claims.email).toLowerCase(), name: String(claims.name || claims.given_name || String(claims.email).split("@")[0]) };
}

// Same account as email/password: an existing email simply logs in.
export async function userForGoogle(email: string, name: string, from: "app" | "website"): Promise<User> {
  const have = await getUserByEmail(email);
  if (have) return have;
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name: name.slice(0, 80),
    passwordHash: hashPassword(crypto.randomBytes(24).toString("hex")), // they can set one later with Forgot password
    createdAt: new Date().toISOString(),
  };
  await createUser(user);
  const admins = getAdminEmails();
  if (admins.length) sendEmail({ to: admins, subject: `New Health365 member (${from}, Google): ${user.name}`, html: emailWrapper("New member joined with Google", `<p><b>Name:</b> ${user.name.replace(/</g, "&lt;")}<br/><b>Email:</b> ${user.email}</p>`) }).catch(() => {});
  sendPushToAdmins({ title: `New member joined (${from})`, body: `${user.name} — ${user.email} (Google)`, url: "/admin" }).catch(() => {});
  return user;
}

// One-time hand-off code for the app (the browser sends health365://auth?code=…).
export async function makeAppCode(user: User) {
  const code = crypto.randomBytes(18).toString("base64url");
  await redis().set(`gauth:${code}`, user.id, "EX", 300);
  return code;
}
export async function takeAppCode(code: string): Promise<string | null> {
  const r = redis();
  const k = `gauth:${String(code).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40)}`;
  const res = await r.multi().get(k).del(k).exec();
  return (res?.[0]?.[1] as string | null) || null;
}
