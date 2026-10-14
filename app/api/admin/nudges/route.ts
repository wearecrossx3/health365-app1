import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getNudges, saveNudges, NudgeSettings } from "@/lib/nudges";

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const int = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "app-notifications"))) return denied();
  return NextResponse.json({ settings: await getNudges() });
}

export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "app-notifications"))) return denied();
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Missing settings." }, { status: 400 });
  const fromHour = int(b.fromHour, 6, 22, 9);
  const s: NudgeSettings = {
    enabled: Boolean(b.enabled),
    perDay: int(b.perDay, 1, 3, 2),
    fromHour,
    toHour: Math.max(fromHour + 1, int(b.toHour, 7, 23, 21)),
    quietDays: (Array.isArray(b.quietDays) ? b.quietDays : []).map(Number).filter((d: number) => d >= 0 && d <= 6),
    nudges: (Array.isArray(b.nudges) ? b.nudges : []).slice(0, 300).map((n: Record<string, unknown>) => ({
      id: txt(n.id, 20) || crypto.randomUUID().slice(0, 8),
      title: txt(n.title, 60),
      body: txt(n.body, 160),
      audience: txt(n.audience, 24) || "all",
      enabled: typeof n.enabled === "boolean" ? n.enabled : true,
    })).filter((n: { title: string }) => n.title),
    updatedAt: new Date().toISOString(),
  };
  await saveNudges(s);
  return NextResponse.json({ ok: true, settings: s });
}
