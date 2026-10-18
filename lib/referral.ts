import crypto from "crypto";
import { redis, getUserById } from "@/lib/kv";
import { getEntitlement, saveEntitlement } from "@/lib/plans";

// Invite friends: every user gets a short code. When a new account is made with
// someone's code, BOTH get one free 7-day plan (the inviter at most MAX times).
// Abuse guard: accounts need a unique mobile number, and rewards are capped.
const MAX = 10;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

const codeKey = (code: string) => `ref_code:${code}`;
const userCodeKey = (uid: string) => `user_ref:${uid}`;
const listKey = (uid: string) => `ref_list:${uid}`;

export function cleanCode(v: unknown) {
  return String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

export async function getOrCreateCode(uid: string, name: string) {
  const r = redis();
  const have = await r.get(userCodeKey(uid));
  if (have) return have;
  const base = (name || "H").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "H365";
  for (let i = 0; i < 8; i++) {
    const tail = Array.from(crypto.randomBytes(3)).map((b) => ALPHA[b % ALPHA.length]).join("");
    const code = base + tail;
    if (await r.set(codeKey(code), uid, "NX")) { await r.set(userCodeKey(uid), code); return code; }
  }
  throw new Error("Couldn't make a referral code");
}

export async function referralStats(uid: string) {
  const r = redis();
  const ids = await r.lrange(listKey(uid), 0, -1);
  return { joined: ids.length, rewarded: Math.min(ids.length, MAX), max: MAX };
}

// Call right after a new account is created. Returns the inviter's first name when the code worked.
export async function applyReferral(newUid: string, rawCode: unknown): Promise<string | null> {
  const code = cleanCode(rawCode);
  if (!code) return null;
  const r = redis();
  const inviter = await r.get(codeKey(code));
  if (!inviter || inviter === newUid) return null;
  if (!(await r.set(`ref_by:${newUid}`, inviter, "NX"))) return null;
  const n = await r.rpush(listKey(inviter), newUid);
  const now = new Date().toISOString();
  const [inv, me] = await Promise.all([getUserById(inviter), getEntitlement(newUid)]);
  me.grants += 1;
  me.grantLog.push({ at: now, by: "referral", note: `Joined with ${inv?.name || "a friend"}'s invite code`, kind: "grant" });
  await saveEntitlement(newUid, me);
  if (n <= MAX) {
    const e = await getEntitlement(inviter);
    e.grants += 1;
    e.grantLog.push({ at: now, by: "referral", note: "A friend joined with your invite code", kind: "grant" });
    await saveEntitlement(inviter, e);
  }
  return (inv?.name || "").split(" ")[0] || "your friend";
}

export async function codeOwnerName(rawCode: unknown) {
  const uid = await redis().get(codeKey(cleanCode(rawCode)));
  if (!uid) return null;
  const u = await getUserById(uid);
  return u ? u.name.split(" ")[0] : null;
}

export async function referralTotals() {
  const r = redis();
  const keys = await r.keys("ref_by:*");
  return { referredSignups: keys.length };
}
