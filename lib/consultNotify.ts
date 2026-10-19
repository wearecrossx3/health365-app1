import { getDietitianApplicationById, Appointment } from "./kv";
import { sendEmail, emailWrapper } from "./email";
import { updateMeta, ChatMeta, firstName } from "./consultChat";

// Emails the dietitian (at most once every 20 minutes per chat) when a client
// writes. The email carries no client details — just a nudge to open the portal.
export async function notifyDietitian(a: Appointment, meta: ChatMeta) {
  if (Date.now() - (meta.dtEmailAt || 0) < 20 * 60 * 1000) return;
  const d = await getDietitianApplicationById(a.dietitianId);
  if (!d?.email) return;
  await updateMeta(a.id, { dtEmailAt: Date.now() });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in";
  await sendEmail({
    to: d.email,
    subject: `New message from ${firstName(a.userName)} — Health365`,
    html: emailWrapper("You have a new client message", `<p>${firstName(a.userName)} sent you a message about their consultation.</p><p><a href="${base}/admin/my-clients">Open your Health365 dietitian portal</a> to reply.</p>`),
  });
}
