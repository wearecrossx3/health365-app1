import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SessionPayload } from "./session";
import { isAdmin, getAdminAccess, defaultAdminPath, AdminPermission } from "./admin";

// Small shared guards for the newer admin pages and API routes.

export async function adminFromRequest(req: NextRequest, permission: AdminPermission): Promise<SessionPayload | null> {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  return (await isAdmin(session, permission)) ? session : null;
}

export const denied = () => NextResponse.json({ error: "Not authorized." }, { status: 403 });

// For server pages: redirects away when the admin lacks this section.
export async function requireAdminPage(permission: AdminPermission): Promise<SessionPayload> {
  const session = verifySessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!access.permissions.includes(permission)) redirect(access.allowed ? defaultAdminPath(access.permissions) : "/admin/login");
  return session!;
}
