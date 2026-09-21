import { SessionPayload } from "./session";
import { getAdminAccount } from "./kv";

// Every admin-panel section that can be individually granted. The key is
// what gets stored in an AdminAccount's `permissions` array and checked
// against; the label is what shows in the Admin Users editor.
export const ADMIN_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard overview", hint: "Stats, consultations, appointments, dietitian approvals" },
  { key: "content", label: "Site Content", hint: "Homepage text, images, colors, popup" },
  { key: "media", label: "Media Library", hint: "Uploaded images" },
  { key: "testimonials", label: "Testimonials", hint: "Add, publish, remove reviews" },
  { key: "diet-plans", label: "Diet Plan Templates", hint: "Per-condition diet plans" },
  { key: "messages", label: "Messages", hint: "Contact form and chat widget messages" },
  { key: "settings", label: "Website Settings", hint: "Contact details, social links" },
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]["key"];
const PERMISSION_KEYS = new Set(ADMIN_PERMISSIONS.map((p) => p.key));

const PERMISSION_PATHS: Record<AdminPermission, string> = {
  dashboard: "/admin",
  content: "/admin/content",
  media: "/admin/media",
  testimonials: "/admin/testimonials",
  "diet-plans": "/admin/diet-plans",
  messages: "/admin/messages",
  settings: "/admin/settings",
};

// Where to send an admin who hits a page they don't have permission
// for: their first available section, so someone with only e.g.
// "testimonials" never bounces between pages they can't see.
export function defaultAdminPath(permissions: AdminPermission[]): string {
  for (const p of ADMIN_PERMISSIONS) {
    if (permissions.includes(p.key)) return PERMISSION_PATHS[p.key];
  }
  return "/admin/login";
}

export function isValidPermission(key: string): key is AdminPermission {
  return PERMISSION_KEYS.has(key as AdminPermission);
}

// The owner — whoever's email is listed in the ADMIN_EMAILS Vercel
// environment variable. Always has every permission, and is the only
// one who can manage other admins. This never depends on the database,
// so the owner can never lock themselves out even if it's unreachable.
export function isSuperAdmin(session: SessionPayload | null): boolean {
  if (!session) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(session.email.toLowerCase());
}

export interface AdminAccess {
  allowed: boolean;
  isSuperAdmin: boolean;
  permissions: AdminPermission[];
}

// Resolves what a signed-in admin session can actually see. Call this
// once per admin page/route; pass a permission to also check that one
// specific section, or omit it to just check "can this person get into
// the panel at all" (used by the outer /admin layout).
export async function getAdminAccess(session: SessionPayload | null): Promise<AdminAccess> {
  if (!session) return { allowed: false, isSuperAdmin: false, permissions: [] };
  if (isSuperAdmin(session)) {
    return { allowed: true, isSuperAdmin: true, permissions: ADMIN_PERMISSIONS.map((p) => p.key) };
  }
  const account = await getAdminAccount(session.email);
  if (!account || account.permissions.length === 0) {
    return { allowed: false, isSuperAdmin: false, permissions: [] };
  }
  return { allowed: true, isSuperAdmin: false, permissions: account.permissions.filter(isValidPermission) };
}

// Convenience wrapper for the common case of gating one page or API
// route: `if (!(await isAdmin(session, "testimonials"))) ...`. Omit the
// permission to just check general admin-panel access.
export async function isAdmin(session: SessionPayload | null, permission?: AdminPermission): Promise<boolean> {
  const access = await getAdminAccess(session);
  if (!access.allowed) return false;
  if (!permission) return true;
  return access.permissions.includes(permission);
}
