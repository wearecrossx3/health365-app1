import type { SessionPayload } from "./session";
import { getAdminAccount, getDietitianApplicationByUserId } from "./kv";

// The client-safe constants and helpers (ADMIN_PERMISSIONS, isValidPermission,
// defaultAdminPath, isSuperAdmin) live in lib/adminPermissions.ts — that file
// has zero imports, so client components (the Admin Users editor) can pull
// from it without dragging kv.ts's ioredis import into the browser bundle.
// Re-exported here so every existing server-side `from "@/lib/admin"` import
// keeps working unchanged.
export {
  ADMIN_PERMISSIONS,
  isValidPermission,
  defaultAdminPath,
  isSuperAdmin,
} from "./adminPermissions";
export type { AdminPermission } from "./adminPermissions";

import { isSuperAdmin as _isSuperAdmin, isValidPermission as _isValidPermission, ADMIN_PERMISSIONS as _ADMIN_PERMISSIONS, AdminPermission as _AdminPermission } from "./adminPermissions";

export interface AdminAccess {
  allowed: boolean;
  isSuperAdmin: boolean;
  permissions: _AdminPermission[];
  dietitianId?: string; // set only for a joined dietitian's portal login (own clients only)
}

// Resolves what a signed-in admin session can actually see. Call this
// once per admin page/route; pass a permission to also check that one
// specific section, or omit it to just check "can this person get into
// the panel at all" (used by the outer /admin layout). Server-only —
// this is the function that reaches into Redis via kv.ts.
export async function getAdminAccess(session: SessionPayload | null): Promise<AdminAccess> {
  if (!session) return { allowed: false, isSuperAdmin: false, permissions: [] };
  if (_isSuperAdmin(session)) {
    return { allowed: true, isSuperAdmin: true, permissions: _ADMIN_PERMISSIONS.map((p) => p.key) };
  }
  const account = await getAdminAccount(session.email);
  if (!account || account.permissions.length === 0) {
    // An approved joined dietitian gets the Dietitian portal — their own
    // clients only — unless the owner switched their portal off.
    const d = session.userId ? await getDietitianApplicationByUserId(session.userId).catch(() => null) : null;
    if (d && d.status === "approved" && d.portal !== false && d.id !== "dr-astha") {
      return { allowed: true, isSuperAdmin: false, permissions: ["my-clients"], dietitianId: d.id };
    }
    return { allowed: false, isSuperAdmin: false, permissions: [] };
  }
  return { allowed: true, isSuperAdmin: false, permissions: account.permissions.filter(_isValidPermission) };
}

// Convenience wrapper for the common case of gating one page or API
// route: `if (!(await isAdmin(session, "testimonials"))) ...`. Omit the
// permission to just check general admin-panel access.
export async function isAdmin(session: SessionPayload | null, permission?: _AdminPermission): Promise<boolean> {
  const access = await getAdminAccess(session);
  if (!access.allowed) return false;
  if (!permission) return true;
  return access.permissions.includes(permission);
}
