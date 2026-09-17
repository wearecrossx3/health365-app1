import { SessionPayload } from "./session";

// Simple admin gate: one or more emails listed in ADMIN_EMAILS (comma
// separated) in your Vercel environment variables. No separate roles
// table needed for a single-owner admin panel like this one.
export function isAdmin(session: SessionPayload | null): boolean {
  if (!session) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(session.email.toLowerCase());
}
