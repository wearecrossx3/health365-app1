import { NextResponse } from "next/server";
import { listPublishedTestimonials } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const testimonials = await listPublishedTestimonials();
  return NextResponse.json({ testimonials });
}
