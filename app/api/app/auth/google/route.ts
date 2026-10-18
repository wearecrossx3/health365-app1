import { NextRequest } from "next/server";
import { appJson, appPreflight, limit } from "@/lib/appApi";
import { takeAppCode } from "@/lib/googleAuth";
import { getUserById } from "@/lib/kv";
import { createSessionCookieValue } from "@/lib/session";

// The app swaps the one-time code from health365://auth?code=… for its login token.
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function POST(req: NextRequest) {
  const limited = await limit(req, "google-app", 20, 3600);
  if (limited) return limited;
  const b = await req.json().catch(() => ({}));
  const uid = await takeAppCode(String(b?.code || ""));
  const user = uid ? await getUserById(uid) : null;
  if (!user) return appJson({ error: "That sign-in has expired — please try again." }, 400);
  const token = createSessionCookieValue({ userId: user.id, email: user.email, name: user.name });
  return appJson({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone || "" } });
}
