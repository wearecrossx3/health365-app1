import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession } from "@/lib/appApi";
import { threadsForClient } from "@/lib/consultChat";

// Polled by the app (also in the background) to show "new message from your dietitian".
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const threads = await threadsForClient(s.userId);
  const latest = threads.filter((t) => t.unread).reduce((m, t) => Math.max(m, t.lastAt), 0);
  return appJson({ unread: threads.reduce((n, t) => n + t.unread, 0), latest });
}
