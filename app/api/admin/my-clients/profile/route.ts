import { NextRequest, NextResponse } from "next/server";
import { dietitianFromRequest } from "@/lib/dietitianGuard";
import { getDietitianApplicationById, createOrUpdateDietitianApplication, getUserById, setUserPhone } from "@/lib/kv";
import { SPECIALIZATIONS } from "@/lib/dietConditions";
import { logActivity } from "@/lib/consultChat";
import { sendPushToAdmins } from "@/lib/push";
import { ratingsFor } from "@/lib/ratings";

// The dietitian edits their own profile in the Dietitian app.
// Photo, about, languages, specialities and city go live at once.
// Fee, qualification and experience wait for the owner's approval.
export const dynamic = "force-dynamic";

const LANGUAGES = ["English", "Hindi", "Gujarati"];
const txt = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

function view(d: NonNullable<Awaited<ReturnType<typeof getDietitianApplicationById>>>, phone = "") {
  return {
    phone,
    name: d.name, photoUrl: d.photoUrl || "", qualification: d.qualification, experienceYears: d.experienceYears,
    specializations: d.specializations || [], languages: d.languages || [], location: d.location, fee: d.fee, about: d.about,
    pending: d.pendingChanges || null,
  };
}

export async function GET(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const d = await getDietitianApplicationById(me.dietitianId);
  const rt = await ratingsFor(me.dietitianId).catch(() => ({ avg: 0, count: 0, recent: [] }));
  const rating = { avg: rt.avg, count: rt.count, recent: rt.recent.map((x) => ({ stars: x.stars, comment: x.comment, client: x.client })) };
  if (!d) return NextResponse.json({ own: true, rating }); // Dt. Astha: edited in Admin › Settings
  const u = await getUserById(d.userId).catch(() => null);
  return NextResponse.json({ profile: view(d, u?.phone || d.phone || ""), specializations: SPECIALIZATIONS, languages: LANGUAGES, rating });
}

export async function POST(req: NextRequest) {
  const me = await dietitianFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const d = await getDietitianApplicationById(me.dietitianId);
  if (!d) return NextResponse.json({ error: "Your profile is managed by the Health365 team." }, { status: 400 });
  const b = await req.json().catch(() => ({}));

  const pick = (v: unknown, allowed: string[]) => (Array.isArray(v) ? v.map(String).filter((x) => allowed.includes(x)).slice(0, 25) : []);
  const location = txt(b.location, 80);
  if (!location) return NextResponse.json({ error: "Please add your city." }, { status: 400 });
  // Mobile number: needed so the team (and WhatsApp alerts) can reach them.
  const ph = await setUserPhone(d.userId, String(b.phone || ""));
  if (!ph.ok) return NextResponse.json({ error: ph.error === "Please enter a valid 10-digit mobile number." ? "Please add your 10-digit mobile number." : ph.error }, { status: 400 });
  d.phone = ph.phone;
  d.about = String(b.about ?? "").trim().slice(0, 800);
  d.languages = pick(b.languages, LANGUAGES);
  d.specializations = pick(b.specializations, SPECIALIZATIONS);
  d.location = location;

  // Fields that need the owner's OK.
  const qualification = txt(b.qualification, 120) || d.qualification;
  const experienceYears = Math.max(0, Math.min(60, Number(b.experienceYears) || 0));
  const fee = txt(b.fee, 60);
  const ask: NonNullable<typeof d.pendingChanges> = { at: new Date().toISOString() };
  if (qualification !== d.qualification) ask.qualification = qualification;
  if (experienceYears !== (d.experienceYears || 0)) ask.experienceYears = experienceYears;
  if (fee !== (d.fee || "")) ask.fee = fee;
  const asked = Object.keys(ask).length > 1;
  d.pendingChanges = asked ? ask : undefined;

  await createOrUpdateDietitianApplication(d);
  await logActivity(me.dietitianId, asked ? "Updated profile (fee/qualification sent for approval)" : "Updated profile").catch(() => {});
  if (asked) {
    const parts = [ask.fee !== undefined && `fee ${ask.fee || "(blank)"}`, ask.qualification && `qualification ${ask.qualification}`, ask.experienceYears !== undefined && `${ask.experienceYears} yrs experience`].filter(Boolean).join(", ");
    sendPushToAdmins({ title: `${d.name} wants to change their profile`, body: `New ${parts}. Approve in Admin › Dietitians.`, url: "/admin/dietitians" }).catch(() => {});
  }
  return NextResponse.json({ ok: true, profile: view(d, ph.phone), waiting: asked });
}
