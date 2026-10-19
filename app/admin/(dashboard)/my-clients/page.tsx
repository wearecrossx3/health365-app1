import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { portalDietitian } from "@/lib/portal";
import DietitianApp from "./DietitianApp";

export const dynamic = "force-dynamic";

// Dietitian portal — an app-style screen (Today · Chats · Clients · Me).
export default async function MyClientsPage() {
  const session = verifySessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/admin/login");
  if (!(await portalDietitian(session))) redirect("/admin");
  return <DietitianApp />;
}
