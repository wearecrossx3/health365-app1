// Split out of lib/admin.ts on purpose: this file must stay free of any
// import that eventually reaches lib/kv.ts (ioredis), because the admin
// users editor is a client component that needs ADMIN_PERMISSIONS. If
// this pulled in kv.ts, Next would try to bundle ioredis for the browser
// and fail with "Module not found: Can't resolve 'net'" — exactly the
// Vercel build error this file fixes.

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
  { key: "app", label: "Mobile App", hint: "App icons, banners, carousels, sound & effects" },
  { key: "app-notifications", label: "App Notifications", hint: "Send notifications to app users" },
  { key: "coupons", label: "Coupons", hint: "Discount codes for paid consultations" },
  { key: "users", label: "Users & Plans", hint: "App/site users, assign diet plans, grant free 7-day plans, plan generator" },
  { key: "offers", label: "App Offers", hint: "Offer popups shown in the app" },
  { key: "blog", label: "Blog", hint: "Write and publish blog posts (site + app)" },
  { key: "foods", label: "Food Database", hint: "Calorie counter foods — edit, hide, add" },
] as const;

// "my-clients" is never granted from the Admin Users editor: it is given
// automatically to an approved joined dietitian (their own clients only).
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]["key"] | "my-clients";
const PERMISSION_KEYS = new Set(ADMIN_PERMISSIONS.map((p) => p.key));

const PERMISSION_PATHS: Record<AdminPermission, string> = {
  dashboard: "/admin",
  content: "/admin/content",
  media: "/admin/media",
  testimonials: "/admin/testimonials",
  "diet-plans": "/admin/diet-plans",
  messages: "/admin/messages",
  settings: "/admin/settings",
  app: "/admin/app-content",
  "app-notifications": "/admin/app-notifications",
  coupons: "/admin/coupons",
  users: "/admin/users",
  offers: "/admin/offers",
  blog: "/admin/blog",
  foods: "/admin/foods",
  "my-clients": "/admin/my-clients",
};

// Where to send an admin who hits a page they don't have permission
// for: their first available section, so someone with only e.g.
// "testimonials" never bounces between pages they can't see.
export function defaultAdminPath(permissions: AdminPermission[]): string {
  for (const p of ADMIN_PERMISSIONS) {
    if (permissions.includes(p.key)) return PERMISSION_PATHS[p.key];
  }
  if (permissions.includes("my-clients")) return PERMISSION_PATHS["my-clients"];
  return "/admin/login";
}

export function isValidPermission(key: string): key is AdminPermission {
  return PERMISSION_KEYS.has(key as (typeof ADMIN_PERMISSIONS)[number]["key"]);
}

// The owner — whoever's email is listed in the ADMIN_EMAILS Vercel
// environment variable. Always has every permission, and is the only
// one who can manage other admins. Takes a plain {email} shape rather
// than importing SessionPayload from lib/session, to keep this file's
// import graph at zero — a session object satisfies this just fine.
export function isSuperAdmin(session: { email: string } | null): boolean {
  if (!session) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(session.email.toLowerCase());
}
