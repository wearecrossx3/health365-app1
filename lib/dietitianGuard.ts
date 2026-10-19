import { NextRequest } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME, SessionPayload } from "./session";
import { portalDietitian } from "./portal";

// Dietitian portal requests: a joined dietitian's own login, or the login set for Dt. Astha.
export async function dietitianFromRequest(req: NextRequest): Promise<{ session: SessionPayload; dietitianId: string } | null> {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  const dietitianId = await portalDietitian(session);
  if (!session || !dietitianId) return null;
  return { session, dietitianId };
}
