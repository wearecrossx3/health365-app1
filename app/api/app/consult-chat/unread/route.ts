import { NextRequest } from "next/server";
import { appJson, appPreflight, getAppSession } from "@/lib/appApi";
import { threadsForClient } from "@/lib/consultChat";
import { listUserPlans } from "@/lib/plans";

// Polled by the app (also in the background) to show "new message from your dietitian".
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function GET(req: NextRequest) {
  const s = getAppSession(req);
  if (!s) return appJson({ error: "Please log in again.", code: "auth" }, 401);
  const [threads, plans] = await Promise.all([threadsForClient(s.userId), listUserPlans(s.userId).catch(() => [])]);
  const latest = threads.filter((t) => t.unread).reduce((m, t) => Math.max(m, t.lastAt), 0);
  // Newest active plan from a dietitian or the team, so the phone can say "Your diet plan is ready".
  const active = plans.filter((p) => p.active).sort((a, b) => Date.parse(b.assignedAt) - Date.parse(a.assignedAt))[0];
  const plan = active ? { at: Date.parse(active.assignedAt) || 0, by: /@/.test(active.assignedBy || "") ? "" : String(active.assignedBy || "").slice(0, 60) } : null;
  return appJson({ unread: threads.reduce((n, t) => n + t.unread, 0), latest, plan });
}
