import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { getDietitianApplicationById, createOrUpdateDietitianApplication } from "@/lib/kv";
import { logActivity } from "@/lib/consultChat";

// Profile photo from the Dietitian app. The app shrinks it to a square JPEG first.
export const dynamic = "force-dynamic";
const MAX = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const d = await getDietitianApplicationById(me.dietitianId);
  if (!d) return NextResponse.json({ error: "Your photo is managed by the Health365 team." }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "No photo received." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Please use a JPG or PNG photo." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Photo is too large. Please pick a smaller one." }, { status: 400 });
  try {
    const blob = await put(`dietitians/${d.id}-${Date.now()}.jpg`, file, { access: "public", contentType: file.type });
    d.photoUrl = blob.url;
    await createOrUpdateDietitianApplication(d);
    await logActivity(me.dietitianId, "Changed profile photo").catch(() => {});
    return NextResponse.json({ ok: true, photoUrl: blob.url });
  } catch (err) {
    console.error("Dietitian photo upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
