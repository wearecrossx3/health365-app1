import crypto from "crypto";
import { redis, getUserById, createUser } from "./kv";
import { hashPassword } from "./auth";

// One-time password reset links. The admin creates a link for a user who
// forgot their password (from Users & Plans or Messages) and sends it on
// WhatsApp/email; the user opens it and picks a new password themselves.
// The link works once and expires after 24 hours.

const HOURS = 24;
const key = (token: string) => `pwreset:${token}`;
const tokenOk = (t: unknown): t is string => typeof t === "string" && /^[a-f0-9]{48}$/.test(t);

export async function createResetLink(userId: string, by: string): Promise<{ token: string; hours: number }> {
  const token = crypto.randomBytes(24).toString("hex");
  await redis().set(key(token), JSON.stringify({ userId, by, at: new Date().toISOString() }), "EX", HOURS * 3600);
  return { token, hours: HOURS };
}

async function lookup(token: unknown) {
  if (!tokenOk(token)) return null;
  const raw = await redis().get(key(token));
  if (!raw) return null;
  try {
    const { userId } = JSON.parse(raw) as { userId: string };
    const user = await getUserById(userId);
    return user ? { user } : null;
  } catch {
    return null;
  }
}

// a@gmail.com → a•••@gmail.com, so the page confirms the account without exposing it
function mask(email: string) {
  const [n, d] = email.split("@");
  return `${n.slice(0, 2)}•••@${d || ""}`;
}

export async function checkResetLink(token: unknown) {
  const hit = await lookup(token);
  return hit ? { name: hit.user.name.split(" ")[0], email: mask(hit.user.email) } : null;
}

export async function useResetLink(token: unknown, password: string): Promise<boolean> {
  const hit = await lookup(token);
  if (!hit) return false;
  await createUser({ ...hit.user, passwordHash: hashPassword(password) });
  await redis().del(key(token as string));
  return true;
}
