import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/kv";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({
      logoUrl: content.logoUrl,
      popup: {
        enabled: content.popupEnabled,
        message: content.popupMessage,
        ctaText: content.popupCtaText,
        ctaLink: content.popupCtaLink,
        trigger: content.popupTrigger,
        triggerValue: content.popupTriggerValue,
      },
    });
  } catch {
    return NextResponse.json({ logoUrl: "", popup: { enabled: false } });
  }
}
