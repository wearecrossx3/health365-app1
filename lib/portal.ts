import { redis, getSiteContent, getDietitianApplicationById } from "./kv";
import { getAdminAccess } from "./admin";
import type { SessionPayload } from "./session";

// Who is using the Dietitian portal/app, and as which dietitian.
//  • a joined dietitian → their own dietitian id
//  • the login chosen for Dt. Astha (default: the owner's email) → "dr-astha"
export const OWN_DT = "dr-astha";
const KEY = "astha_portal_email";

export async function getAsthaPortalEmail(): Promise<string> {
  const saved = await redis().get(KEY).catch(() => null);
  if (saved) return saved;
  return (process.env.ADMIN_EMAILS || "").split(",")[0].trim().toLowerCase();
}
export async function setAsthaPortalEmail(email: string) {
  await redis().set(KEY, email.trim().toLowerCase());
}

export async function portalDietitian(session: SessionPayload | null): Promise<string | null> {
  if (!session) return null;
  const access = await getAdminAccess(session);
  if (access.dietitianId) return access.dietitianId;
  if (access.allowed && session.email.toLowerCase() === (await getAsthaPortalEmail())) return OWN_DT;
  return null;
}

export async function dietitianInfo(id: string): Promise<{ name: string; email: string; fee: number }> {
  if (id === OWN_DT) {
    const c = await getSiteContent();
    const fee = Number(String(c.premiumDiscountedPrice || "").replace(/[^\d.]/g, "")) || 0;
    return { name: c.asthaName || "Dt. Astha Jadeja", email: await getAsthaPortalEmail(), fee };
  }
  const d = await getDietitianApplicationById(id);
  return { name: d?.name || "", email: d?.email || "", fee: Number(String(d?.fee || "").replace(/[^\d.]/g, "")) || 0 };
}

export const isDietitianApp = (ua: string | null) => !!ua && ua.includes("Health365Dietitian");
