import { Appointment, getUserById } from "./kv";
import { sendEmail, emailWrapper } from "./email";
import { getMeta, updateMeta, firstName } from "./consultChat";

// Emails the client (at most every 30 min per chat) when their dietitian
// writes. The app also shows a notification on its own (it checks
// /api/app/consult-chat/unread in the background).
export async function sendNotifyToClient(a: Appointment, title = "Your dietitian replied") {
  const meta = await getMeta(a.id);
  if (Date.now() - (meta.clientEmailAt || 0) < 30 * 60 * 1000) return;
  const u = await getUserById(a.userId);
  if (!u?.email) return;
  await updateMeta(a.id, { clientEmailAt: Date.now() });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in";
  await sendEmail({
    to: u.email,
    subject: `${title} — Health365`,
    html: emailWrapper(title, `<p>Hi ${firstName(u.name)}, ${a.dietitianName} sent you a message about your consultation.</p><p>Open the Health365 app (Consult tab) or <a href="${base}/dashboard/chat/${a.id}">reply on the website</a>.</p>`),
  });
}
