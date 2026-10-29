import { NextRequest, NextResponse } from "next/server";
import { getAppt, firstName } from "@/lib/consultChat";
import { rateTokenOk, getRating, recordRating } from "@/lib/ratings";

// Public rating endpoint (the link in the chat carries a signed token).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get("id") || "");
  const t = String(req.nextUrl.searchParams.get("t") || "");
  if (!id || !rateTokenOk(id, t)) return NextResponse.json({ error: "This rating link isn't valid." }, { status: 403 });
  const a = await getAppt(id);
  if (!a) return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
  const r = await getRating(id);
  return NextResponse.json({ dietitian: a.dietitianName, client: firstName(a.userName), date: a.date, rating: r ? { stars: r.stars, comment: r.comment } : null });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || ""), t = String(b.t || "");
  if (!id || !rateTokenOk(id, t)) return NextResponse.json({ error: "This rating link isn't valid." }, { status: 403 });
  const a = await getAppt(id);
  if (!a) return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
  const stars = Math.round(Number(b.stars));
  if (!(stars >= 1 && stars <= 5)) return NextResponse.json({ error: "Pick 1 to 5 stars." }, { status: 400 });
  const comment = String(b.comment || "").replace(/\s+/g, " ").trim().slice(0, 600);
  await recordRating(a, stars, comment, firstName(a.userName));
  return NextResponse.json({ ok: true });
}
