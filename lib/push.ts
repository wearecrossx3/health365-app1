import webpush from "web-push";
import { listAllPushSubscriptions, deletePushSubscription } from "./kv";

// Fallback keys so notifications work out of the box without extra setup.
// For a production deploy, generate your own pair (`npx web-push
// generate-vapid-keys`) and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in
// Vercel's environment variables instead — anyone with the private key
// could send push notifications "from" this site, so it's worth rotating
// off the shared default once things are working.
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BDxSje4HNEJ2jM5l4QDBTRL5t4JZqab2AKTjx3X1r-nba91g7h4BRzJ1vKqndk-iNDnyz-WiFZOWEwmEk7QU0cg";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "f4xFZHcndOPkaFGb2ds5OZlfB-TBJ6G3I8J9AXfjwfM";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@health365.app";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string; // where notificationclick should take the admin, e.g. "/admin/messages"
}

// Sends to every device any admin has subscribed on. Silently drops
// subscriptions the push service reports as gone (410/404) so the list
// doesn't accumulate dead devices from uninstalled browsers.
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  ensureConfigured();
  const subs = await listAllPushSubscriptions();
  if (subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(sub.id).catch(() => {});
        }
        // Other errors (network blips, misconfigured keys) are swallowed —
        // a failed notification should never block the request that
        // triggered it (saving a consultation, a message, etc.).
      }
    })
  );
}
