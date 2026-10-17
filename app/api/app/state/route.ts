import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession, limit } from "@/lib/appApi";
import { getJSON } from "@/lib/kv";
import { saveBackup } from "@/lib/appBackup";

// The app's own progress for a signed-in user — plan, ticked meals, food log,
// water, weight history and settings — so logging out, reinstalling or
// switching phones brings everything back after logging in again.
// Stored as one JSON document per user (deleted with the account).
export const dynamic = "force-dynamic";

const key = (userId: string) => `app_state:${userId}`;
const MAX = 400_000; // characters

interface Saved { state: Record<string, unknown>; updatedAt: number }

export async function OPTIONS() {
  return appPreflight();
}

export async function GET(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  try {
    const saved = await getJSON<Saved>(key(session.userId));
    return appJson({ state: saved?.state || null, updatedAt: saved?.updatedAt || 0 });
  } catch (err) {
    console.error("App state GET failed:", err);
    return appJson({ error: "Couldn't load your progress right now." }, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = getAppSession(req);
  if (!session) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const limited = await limit(req, "app-state", 300, 3600);
  if (limited) return limited;
  try {
    const raw = await req.text();
    if (raw.length > MAX) return appJson({ error: "Too much data to save." }, 413);
    const b = JSON.parse(raw || "{}");
    if (!b || typeof b.state !== "object" || Array.isArray(b.state)) return appJson({ error: "Nothing to save." }, 400);
    const state = b.state as Record<string, unknown>;
    for (const k of ["token", "user", "avatarImg", "editing"]) delete state[k];
    const updatedAt = await saveBackup(session.userId, state);
    return appJson({ ok: true, updatedAt });
  } catch (err) {
    console.error("App state POST failed:", err);
    return appJson({ error: "Couldn't save your progress right now." }, 500);
  }
}
