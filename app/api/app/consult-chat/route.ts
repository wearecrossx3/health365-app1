import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession } from "@/lib/appApi";
import { threadsForClient } from "@/lib/consultChat";

// The signed-in client's consultation chats (one per booking with a joined dietitian).
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const threads = await threadsForClient(s.userId);
  return appJson({ threads, unread: threads.reduce((n, t) => n + t.unread, 0) });
}
