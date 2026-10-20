import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { portalDietitian } from "@/lib/portal";
import DietitianApp from "./DietitianApp";
import { dietitianPwa } from "@/lib/dietitianPwa";

export const metadata = dietitianPwa;

export const dynamic = "force-dynamic";

// Dietitian portal — an app-style screen (Today · Chats · Clients · Me).
// Lives outside the (dashboard) group so it never gets the admin sidebar,
// even for a team login that also has a dietitian profile (Dt. Astha).
export default async function MyClientsPage() {
  const session = verifySessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/admin/login?next=/admin/my-clients");
  if (!(await portalDietitian(session))) redirect("/admin");
  return <DietitianApp />;
}
