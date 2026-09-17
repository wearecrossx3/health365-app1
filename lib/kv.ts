import { kv } from "@vercel/kv";

// Thin wrapper around Vercel KV so the rest of the app never imports
// @vercel/kv directly — swapping storage later means editing this one
// file. Requires KV_REST_API_URL / KV_REST_API_TOKEN (set automatically
// when you attach a Vercel KV store to this project — see README).

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  userId: string;
  goal: string;
  dietType: string;
  allergens: string[];
  conditions: string[];
  raw: Record<string, unknown>;
  createdAt: string;
  status: "submitted" | "reviewed";
}

const userKey = (email: string) => `user:${email.toLowerCase()}`;
const userByIdKey = (id: string) => `user_id:${id}`;
const consultationKey = (id: string) => `consultation:${id}`;
const userConsultationsKey = (userId: string) => `user_consultations:${userId}`;

export async function getUserByEmail(email: string): Promise<User | null> {
  return (await kv.get<User>(userKey(email))) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  return (await kv.get<User>(userByIdKey(id))) ?? null;
}

export async function createUser(user: User): Promise<void> {
  await kv.set(userKey(user.email), user);
  await kv.set(userByIdKey(user.id), user);
}

export async function saveConsultation(c: Consultation): Promise<void> {
  await kv.set(consultationKey(c.id), c);
  await kv.lpush(userConsultationsKey(c.userId), c.id);
}

export async function getConsultationsForUser(userId: string): Promise<Consultation[]> {
  const ids = (await kv.lrange<string>(userConsultationsKey(userId), 0, -1)) ?? [];
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => kv.get<Consultation>(consultationKey(id))));
  return results.filter((c): c is Consultation => c !== null);
}
