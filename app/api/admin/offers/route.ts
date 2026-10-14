import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { listOffers, saveOffers, AppOffer, OfferAction, OfferFrequency } from "@/lib/offers";

const PALETTE = ["#4EAA67", "#287379", "#E5394F", "#CBDB3D", "#F6961D", "#9997C9"];
const ACTIONS: OfferAction[] = ["consult", "plan", "blog", "calories", "none"];
const FREQ: OfferFrequency[] = ["once", "daily", "every_open"];
const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const url = (v: unknown) => (/^https?:\/\//i.test(txt(v, 600)) ? txt(v, 600) : "");
const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : "");

function clean(x: Record<string, unknown>, prev?: AppOffer): AppOffer {
  return {
    id: prev?.id || crypto.randomUUID().slice(0, 8),
    title: txt(x.title, 80),
    text: txt(x.text, 240),
    imageUrl: url(x.imageUrl),
    badge: txt(x.badge, 24),
    ctaText: txt(x.ctaText, 32) || "Book now",
    action: ACTIONS.includes(x.action as OfferAction) ? (x.action as OfferAction) : "consult",
    blogSlug: txt(x.blogSlug, 80).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    couponCode: txt(x.couponCode, 24).toUpperCase().replace(/[^A-Z0-9]/g, ""),
    color: PALETTE.includes(String(x.color)) ? String(x.color) : "#287379",
    startsOn: day(x.startsOn),
    endsOn: day(x.endsOn),
    frequency: FREQ.includes(x.frequency as OfferFrequency) ? (x.frequency as OfferFrequency) : "once",
    audience: txt(x.audience, 24) || "all",
    enabled: typeof x.enabled === "boolean" ? x.enabled : true,
    createdAt: prev?.createdAt || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "offers"))) return denied();
  return NextResponse.json({ offers: await listOffers() });
}

// Create (no id) or update (with id).
export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "offers"))) return denied();
  const b = await req.json().catch(() => null);
  if (!b || !txt(b.title, 80)) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  const all = await listOffers();
  const i = b.id ? all.findIndex((o) => o.id === b.id) : -1;
  const offer = clean(b, i >= 0 ? all[i] : undefined);
  if (offer.startsOn && offer.endsOn && offer.endsOn < offer.startsOn) return NextResponse.json({ error: "End date is before the start date." }, { status: 400 });
  if (i >= 0) all[i] = offer;
  else all.unshift(offer);
  await saveOffers(all);
  return NextResponse.json({ ok: true, offer });
}

export async function DELETE(req: NextRequest) {
  if (!(await adminFromRequest(req, "offers"))) return denied();
  const b = await req.json().catch(() => null);
  await saveOffers((await listOffers()).filter((o) => o.id !== b?.id));
  return NextResponse.json({ ok: true });
}
