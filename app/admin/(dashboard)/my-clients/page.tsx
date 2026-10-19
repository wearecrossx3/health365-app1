import { requireAdminPage } from "@/lib/adminGuard";
import DietitianApp from "./DietitianApp";

export const dynamic = "force-dynamic";

// Joined dietitian's portal — an app-style screen (Today · Chats · Clients · Me).
export default async function MyClientsPage() {
  await requireAdminPage("my-clients");
  return <DietitianApp />;
}
