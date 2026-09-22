import { NextResponse } from "next/server";
import { listAllDietTemplates } from "@/lib/kv";

// Same reasoning as /api/public-content — force fresh data on every
// request so admin-edited templates show up without a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await listAllDietTemplates();
    const byKey: Record<string, (typeof templates)[number]> = {};
    for (const t of templates) byKey[t.key] = t;
    return NextResponse.json({ templates: byKey });
  } catch {
    return NextResponse.json({ templates: {} });
  }
}
