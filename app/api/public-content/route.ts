import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/kv";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({
      logoUrlLight: content.logoUrlLight,
      logoUrlDark: content.logoUrlDark,
      themeAccentColor: content.themeAccentColor,
      themeButtonColor: content.themeButtonColor,
      heroTextOffsetY: content.heroTextOffsetY,
      finalCtaImageUrl: content.finalCtaImageUrl,
      approachImageUrl: content.approachImageUrl,
      processImages: content.processImages,
      conditionImages: content.conditionImages,
      goalImages: content.goalImages,
      instagramUrl: content.instagramUrl,
      youtubeUrl: content.youtubeUrl,
      pinterestUrl: content.pinterestUrl,
      linkedinUrl: content.linkedinUrl,
      oncologyEnabled: content.sectionsEnabled.oncology,
      oncologyImageUrl: content.oncologyImageUrl,
      oncologyTitle: content.oncologyTitle,
      oncologySubtitle: content.oncologySubtitle,
      oncologyButtonText: content.oncologyButtonText,
      premiumOriginalPrice: content.premiumOriginalPrice,
      premiumDiscountedPrice: content.premiumDiscountedPrice,
      premiumUpiId: content.premiumUpiId,
      popup: {
        enabled: content.popupEnabled,
        headline: content.popupHeadline,
        message: content.popupMessage,
        imageUrl: content.popupImageUrl,
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
