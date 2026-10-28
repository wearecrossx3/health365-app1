import { NextRequest, NextResponse } from "next/server";
import { getAppt, firstName, addMessage } from "@/lib/consultChat";
import { rateTokenOk, getRating, saveRating } from "@/lib/ratings";
import { addNotice } from "@/lib/dietitianNotices";

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
  const first = !(await getRating(id));
  await saveRating({ apptId: id, dietitianId: a.dietitianId, stars, comment, client: firstName(a.userName), at: new Date().toISOString() });
  if (first) {
    await addMessage(id, "team", `⭐ Thank you for rating your consultation ${"★".repeat(stars)}${"☆".repeat(5 - stars)}`).catch(() => {});
    await addNotice(a.dietitianId, { title: `New rating: ${"★".repeat(stars)}`, body: `${firstName(a.userName)} rated your consultation ${stars}/5${comment ? `: “${comment}”` : "."}` }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
