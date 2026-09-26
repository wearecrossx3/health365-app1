import { getSiteContent, listApprovedDietitians, listAllDietTemplates, listPublishedTestimonials } from "@/lib/kv";
import { DIET_TEMPLATE_OPTIONS } from "@/lib/dietConditions";
import { appJson, appPreflight } from "@/lib/appApi";

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
    const [c, approved, templates, testimonials] = await Promise.all([
      getSiteContent(),
      listApprovedDietitians().catch(() => []),
      listAllDietTemplates().catch(() => []),
      listPublishedTestimonials().catch(() => []),
    ]);

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
    });
  } catch (err) {
    console.error("App bootstrap failed:", err);
    return appJson({ error: "Couldn't load app data right now." }, 500);
  }
}
