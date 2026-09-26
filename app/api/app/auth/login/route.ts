import { NextRequest } from "next/server";
import { getUserByEmail } from "@/lib/kv";
import { verifyPassword } from "@/lib/auth";
import { createSessionCookieValue } from "@/lib/session";
import { appJson, appPreflight, limit, str } from "@/lib/appApi";

export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-login", 20, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const email = str(body?.email, 120).toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) return appJson({ error: "Email and password are required." }, 400);

  try {
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return appJson({ error: "Incorrect email or password." }, 401);
    }
    const token = createSessionCookieValue({ userId: user.id, email: user.email, name: user.name });
    return appJson({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone || "" } });
  } catch (err) {
    console.error("App login failed:", err);
    return appJson({ error: "Couldn't log in right now — please try again." }, 500);
  }
}
