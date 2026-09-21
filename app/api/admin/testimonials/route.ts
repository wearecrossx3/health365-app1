import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAllTestimonials, saveTestimonial, setTestimonialPublished, deleteTestimonial, Testimonial } from "@/lib/kv";

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  return isAdmin(session);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const testimonials = await listAllTestimonials();
  return NextResponse.json({ testimonials });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.quote) {
    return NextResponse.json({ error: "Name and quote are required." }, { status: 400 });
  }
  const testimonial: Testimonial = {
    id: crypto.randomUUID(),
    name: String(body.name),
    role: String(body.role || ""),
    quote: String(body.quote),
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    photoUrl: String(body.photoUrl || ""),
    published: Boolean(body.published),
    createdAt: new Date().toISOString(),
  };
  await saveTestimonial(testimonial);
  return NextResponse.json({ ok: true, testimonial });
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id || typeof body?.published !== "boolean") {
    return NextResponse.json({ error: "Missing id or published state." }, { status: 400 });
  }
  await setTestimonialPublished(body.id, body.published);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await deleteTestimonial(body.id);
  return NextResponse.json({ ok: true });
}
