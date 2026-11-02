import crypto from "crypto";
import { redis, getDietitianApplicationByUserId, getUserById } from "./kv";
import { portalDietitian, OWN_DT } from "./portal";

// Lets the main Health365 app open the dietitian portal for a dietitian
// without a second login: the app swaps its login token for a one-time code
// (valid 2 minutes), and the portal link turns that code into a portal session.

export type DtStatus = { status: "approved" | "pending" | "rejected" | "none"; portal: boolean; name?: string };

export async function dietitianStatus(userId: string): Promise<DtStatus> {
  const u = await getUserById(userId).catch(() => null);
  if (!u) return { status: "none", portal: false };
  const sess = { userId: u.id, email: u.email, name: u.name, exp: Date.now() + 60_000 };
  const pid = await portalDietitian(sess).catch(() => null);
  if (pid === OWN_DT) return { status: "approved", portal: true, name: u.name };
  const d = await getDietitianApplicationByUserId(u.id).catch(() => null);
  if (!d) return { status: "none", portal: false };
  return { status: d.status, portal: !!pid, name: d.name };
}

export async function makeHandoff(userId: string, to: "portal" | "join"): Promise<string> {
  const code = crypto.randomBytes(24).toString("hex");
  await redis().set(`portal_handoff:${code}`, JSON.stringify({ userId, to }), "EX", 120);
  return code;
}

export async function takeHandoff(code: string): Promise<{ userId: string; to: "portal" | "join" } | null> {
  if (!/^[a-f0-9]{48}$/.test(code)) return null;
  const k = `portal_handoff:${code}`;
  const v = await redis().get(k);
  if (!v) return null;
  await redis().del(k);
  try { return JSON.parse(v); } catch { return null; }
}
