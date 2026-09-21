import { NextResponse } from "next/server";
import { listAllDietTemplates } from "@/lib/kv";

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
