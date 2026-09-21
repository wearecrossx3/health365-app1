import { NextResponse } from "next/server";
import { listPublishedTestimonials } from "@/lib/kv";

export async function GET() {
  const testimonials = await listPublishedTestimonials();
  return NextResponse.json({ testimonials });
}
