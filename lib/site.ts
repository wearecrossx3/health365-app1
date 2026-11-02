// The public address for links in emails, messages and pages.
// Vercel's NEXT_PUBLIC_SITE_URL may still point at *.vercel.app — never use that.
export const CANONICAL = "https://www.thehealth365.in";
export function siteUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  return env && /^https:\/\//.test(env) && !/vercel\.app/i.test(env) ? env : CANONICAL;
}
// A request's own host, unless it is a vercel.app / internal address.
export function hostBase(host: string | null | undefined, proto = "https"): string {
  const h = String(host || "").trim();
  if (!h || /vercel\.app$/i.test(h) || /^(localhost|127\.|10\.|192\.168\.)/.test(h)) return siteUrl();
  return `${proto}://${h}`.replace(/\/$/, "");
}
