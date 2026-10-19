import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { threadsForDietitian } from "@/lib/consultChat";
import { getDietitianApplicationById } from "@/lib/kv";
import { feeNumber } from "@/lib/feeNumber";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const [threads, d] = await Promise.all([threadsForDietitian(me.dietitianId), getDietitianApplicationById(me.dietitianId)]);
  const fee = feeNumber(d?.fee || "") || 0;
  const month = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
  const booked = threads.filter((t) => t.status === "booked");
  return NextResponse.json({
    me: { name: d?.name || "", fee },
    threads,
    earnings: { fee, thisMonth: booked.filter((t) => t.date.startsWith(month)).length, total: booked.length },
  });
}
