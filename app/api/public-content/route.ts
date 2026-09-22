import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/kv";

// Without this, Next.js can statically cache this route at build time
// (it has no cookies/headers/params to force dynamic rendering on its
// own) — meaning admin edits would never show up on the live site until
// a full redeploy. Force it to run fresh on every request instead.
export const dynamic = "force-dynamic";

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
      asthaName: content.asthaName,
      asthaRole: content.asthaRole,
      asthaBio: content.asthaBio,
      asthaPhotoUrl: content.asthaPhotoUrl,
      asthaSpecializations: content.asthaSpecializations,
      asthaLanguages: content.asthaLanguages,
      asthaExperienceYears: content.asthaExperienceYears,
      asthaLocation: content.asthaLocation,
      asthaFee: content.asthaFee,
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
