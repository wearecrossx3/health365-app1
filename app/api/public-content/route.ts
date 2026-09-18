import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/kv";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({
      logoUrlLight: content.logoUrlLight,
      logoUrlDark: content.logoUrlDark,
      finalCtaImageUrl: content.finalCtaImageUrl,
      approachImageUrl: content.approachImageUrl,
      processImages: content.processImages,
      conditionImages: content.conditionImages,
      goalImages: content.goalImages,
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
    return NextResponse.json({ logoUrlLight: "", logoUrlDark: "", popup: { enabled: false } });
  }
}
