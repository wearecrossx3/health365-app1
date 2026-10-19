import { NextRequest } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SessionPayload } from "./session";
import { getAdminAccess } from "./admin";

// Dietitian portal requests: only a joined dietitian's own login passes.
export async function dietitianFromRequest(req: NextRequest): Promise<{ session: SessionPayload; dietitianId: string } | null> {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const access = await getAdminAccess(session);
  if (!session || !access.dietitianId) return null;
  return { session, dietitianId: access.dietitianId };
}
