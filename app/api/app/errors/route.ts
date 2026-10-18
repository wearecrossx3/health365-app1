import { NextRequest } from "next/server";
import { appJson, appPreflight, limit, str } from "@/lib/appApi";
import { recordAppError } from "@/lib/appErrors";

// Error reports from the app (a screen that failed, a crash) → admin Insights page.
export const dynamic = "force-dynamic";
export async function OPTIONS() { return appPreflight(); }

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-errors", 30, 3600);
  if (limited) return limited;
  const b = await req.json().catch(() => ({}));
  const items = Array.isArray(b?.items) ? b.items.slice(0, 5) : [];
  const version = str(b?.version, 12), device = str(b?.did, 40);
  for (const it of items) {
    const msg = str(it?.msg, 300);
    if (!msg) continue;
    await recordAppError({ msg, stack: str(it?.stack, 1500), where: str(it?.where, 40), version, device }).catch(() => {});
  }
  return appJson({ ok: true });
}
