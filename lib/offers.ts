import { getJSON, setJSON } from "./kv";

// Offer popups for the Android app (Admin → App Offers). The app downloads
// the active ones with /api/app/bootstrap and shows one as a popup when the
// app opens — no new APK needed to run a new offer.

export type OfferAction = "consult" | "plan" | "blog" | "calories" | "none";
export type OfferFrequency = "once" | "daily" | "every_open";

export interface AppOffer {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  badge: string; // small pill, e.g. "40% OFF" or "Diwali"
  ctaText: string;
  action: OfferAction;
  blogSlug: string; // when action = "blog"
  couponCode: string; // shown on the popup with a copy button (optional)
  color: string; // brand palette hex
  startsOn: string; // YYYY-MM-DD, empty = immediately
  endsOn: string; // YYYY-MM-DD, empty = no end
  frequency: OfferFrequency;
  audience: string; // "all" | "account" | "guest" | "free" (used free plan) | condition key
  enabled: boolean;
  createdAt: string;
}

const KEY = "app_offers";

export async function listOffers(): Promise<AppOffer[]> {
  return (await getJSON<AppOffer[]>(KEY)) || [];
}

export async function saveOffers(list: AppOffer[]): Promise<void> {
  await setJSON(KEY, list.slice(0, 40));
}

const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export function isOfferLive(o: AppOffer, today = todayIST()): boolean {
  if (!o.enabled) return false;
  if (o.startsOn && today < o.startsOn) return false;
  if (o.endsOn && today > o.endsOn) return false;
  return true;
}

export async function listLiveOffers(): Promise<AppOffer[]> {
  const today = todayIST();
  return (await listOffers()).filter((o) => isOfferLive(o, today));
}
