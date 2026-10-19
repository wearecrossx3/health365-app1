import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { threadsForDietitian } from "@/lib/consultChat";
import { getDietitianApplicationById, getConsultationsForUser } from "@/lib/kv";
import { feeNumber } from "@/lib/feeNumber";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const [rows, d] = await Promise.all([threadsForDietitian(me.dietitianId), getDietitianApplicationById(me.dietitianId)]);
  // A short profile line per client (goal, conditions, food) for the cards — never contact details.
  const byUser = new Map<string, { goal: string; conditions: string[]; diet: string }>();
  await Promise.all([...new Set(rows.map((r) => r.userId))].map(async (uid) => {
    const c = (await getConsultationsForUser(uid).catch(() => [])).sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt))[0];
    if (c) byUser.set(uid, { goal: c.goal || "", conditions: c.conditions || [], diet: c.dietType || "" });
  }));
  const threads = rows.map(({ userId, ...t }) => ({ ...t, profile: byUser.get(userId) || null }));
  const fee = feeNumber(d?.fee || "") || 0;
  const month = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
  const booked = rows.filter((t) => t.status === "booked");
  return NextResponse.json({
    me: { name: d?.name || "", fee },
    threads,
    earnings: { fee, thisMonth: booked.filter((t) => t.date.startsWith(month)).length, total: booked.length },
  });
}
