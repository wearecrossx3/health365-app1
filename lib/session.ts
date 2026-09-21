import crypto from "crypto";

// Lightweight HMAC-signed session cookie — the same pattern used for the
// Antaraga admin panel. No external auth provider, no Supabase: just a
// signed, tamper-proof payload the server can verify on every request.

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "h365_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return base64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

export function createSessionCookieValue(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const json = base64url(JSON.stringify(full));
  const sig = sign(json);
  return `${json}.${sig}`;
}

export function verifySessionCookieValue(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [json, sig] = value.split(".");
  if (!json || !sig) return null;
  if (sign(json) !== sig) return null; // tampered or wrong secret
  try {
    const payload: SessionPayload = JSON.parse(
      Buffer.from(json.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;

// A completely separate cookie for the admin panel. Logging into /admin
// only ever sets this one — it never touches h365_session — so signing
// into the admin panel does not also sign the owner into the regular
// customer-facing account (and vice versa). Same signing/verification
// functions above are reused for both; only the cookie name differs.
export const ADMIN_SESSION_COOKIE_NAME = "h365_admin_session";
