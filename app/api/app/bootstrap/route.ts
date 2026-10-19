import { getNotifTones, DEFAULT_TONES } from "@/lib/notifTones";
import { getSiteContent, listApprovedDietitians, listAllDietTemplates, listPublishedTestimonials, getAppContent, DEFAULT_APP_CONTENT } from "@/lib/kv";
import { DIET_TEMPLATE_OPTIONS } from "@/lib/dietConditions";
import { appJson, appPreflight } from "@/lib/appApi";
import { listLiveOffers } from "@/lib/offers";
import { getNudges, DEFAULT_NUDGES } from "@/lib/nudges";
import { listPublishedPosts } from "@/lib/blog";
import { getFoodOverrides } from "@/lib/foods";
import { googleEnabled } from "@/lib/googleAuth";
import foodDb from "@/lib/data/health365-foods.json";

// Everything the app needs from the admin panel, in one call. The app
// caches this on the phone and refreshes it every time it opens, so any
// change saved in /admin shows up in the app without a new APK.
export const dynamic = "force-dynamic";

const split = (s: string) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

// Same fixed daily slots the website's BookingWidget offers.
const BOOKING_TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

export async function OPTIONS() {
  return appPreflight();
}

export async function GET() {
  try {
    const [c, approved, templates, testimonials, appContent, offers, nudges, posts, foodOv] = await Promise.all([
      getSiteContent(),
      listApprovedDietitians().catch(() => []),
      listAllDietTemplates().catch(() => []),
      listPublishedTestimonials().catch(() => []),
      getAppContent().catch(() => DEFAULT_APP_CONTENT),
      listLiveOffers().catch(() => []),
      getNudges().catch(() => DEFAULT_NUDGES),
      listPublishedPosts().catch(() => []),
      getFoodOverrides().catch(() => null),
    ]);
    const orig = Number(String(c.premiumOriginalPrice).replace(/[^\d.]/g, "")) || 0;
    const disc = Number(String(c.premiumDiscountedPrice).replace(/[^\d.]/g, "")) || 0;

    const astha = {
      id: "dr-astha",
      name: c.asthaName,
      role: c.asthaRole,
      bio: c.asthaBio,
      quote: c.asthaQuote,
      photoUrl: c.asthaPhotoUrl,
      specializations: split(c.asthaSpecializations),
      languages: split(c.asthaLanguages),
      experienceYears: Number(c.asthaExperienceYears) || 0,
      location: c.asthaLocation,
      fee: c.asthaFee,
      verified: true,
    };
    const others = approved.map((d) => ({
      id: d.id,
      name: d.name,
      role: d.qualification,
      bio: d.about,
      quote: "",
      photoUrl: "",
      specializations: d.specializations || [],
      languages: d.languages || [],
      experienceYears: d.experienceYears || 0,
      location: d.location,
      fee: d.fee,
      verified: true,
    }));

    const byKey: Record<string, unknown> = {};
    for (const t of templates) byKey[t.key] = t;

    return appJson({
      version: 1,
      fetchedAt: new Date().toISOString(),
      settings: {
        siteTitle: c.siteTitle,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        whatsappNumber: c.whatsappNumber,
        instagramUrl: c.instagramUrl,
        youtubeUrl: c.youtubeUrl,
        premiumOriginalPrice: c.premiumOriginalPrice,
        premiumDiscountedPrice: c.premiumDiscountedPrice,
        premiumUpiId: c.premiumUpiId,
        premiumValidityDays: c.premiumValidityDays,
        premiumIncludes: split(c.premiumIncludes),
        premiumPolicy: c.premiumPolicy,
        googleLogin: googleEnabled(),
        scanEnabled: Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY),
        premiumSaving: orig > disc && disc > 0 ? orig - disc : 0,
        premiumDiscountPct: orig > disc && disc > 0 ? Math.round(((orig - disc) / orig) * 100) : 0,
        goalLabels: c.goalLabels,
        heroStatNumber: c.heroStatNumber,
        heroStatLabel: c.heroStatLabel,
      },
      oncology: {
        enabled: c.sectionsEnabled.oncology,
        title: c.oncologyTitle,
        subtitle: c.oncologySubtitle,
        buttonText: c.oncologyButtonText,
        imageUrl: c.oncologyImageUrl,
      },
      dietitians: [astha, ...others],
      templates: byKey,
      templateOptions: DIET_TEMPLATE_OPTIONS,
      testimonials: testimonials.map((t) => ({ id: t.id, name: t.name, role: t.role, quote: t.quote, rating: t.rating, photoUrl: t.photoUrl })),
      bookingTimes: BOOKING_TIMES,
      planAccess: {
        freeDays: 7,
        oneDayFree: true,
        lockTitle: c.planLockTitle,
        lockText: c.planLockText,
        priceLabel: c.planPriceLabel,
      },
      offers,
      nudges: { ...nudges, nudges: nudges.nudges.filter((n) => n.enabled) },
      blog: posts.filter((p) => p.showInApp).slice(0, 10).map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, tag: p.tag, coverUrl: p.coverUrl, color: p.color, emoji: p.emoji, readMins: p.readMins, featured: p.featured })),
      foodsVersion: `${(foodDb as { version: string }).version}-${foodOv?.updatedAt || "0"}`,
      app: {
        ...appContent,
        notifTones: await getNotifTones().catch(() => DEFAULT_TONES),
        banners: appContent.banners.filter((b) => b.enabled),
        habitCards: appContent.habitCards.filter((h) => h.enabled),
      },
    });
  } catch (err) {
    console.error("App bootstrap failed:", err);
    return appJson({ error: "Couldn't load app data right now." }, 500);
  }
}
