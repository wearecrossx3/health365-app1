import Redis from "ioredis";

// Vercel's Redis product (the current one, replacing the older "KV"
// product) gives you a single REDIS_URL connection string — not the
// KV_REST_API_URL / KV_REST_API_TOKEN pair the old @vercel/kv package
// expected. This talks to it directly with ioredis instead.

const globalForRedis = globalThis as unknown as { __redis?: Redis };

function client(): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error(
      "Missing REDIS_URL environment variable — attach a Redis store to this project in Vercel's Storage tab."
    );
  }
  if (!globalForRedis.__redis) {
    globalForRedis.__redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  }
  return globalForRedis.__redis;
}

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await client().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
async function setJSON(key: string, value: unknown): Promise<void> {
  await client().set(key, JSON.stringify(value));
}

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
  return getJSON<User>(userKey(email));
}

export async function getUserById(id: string): Promise<User | null> {
  return getJSON<User>(userByIdKey(id));
}

export async function createUser(user: User): Promise<void> {
  await setJSON(userKey(user.email), user);
  await setJSON(userByIdKey(user.id), user);
}

export async function saveConsultation(c: Consultation): Promise<void> {
  await setJSON(consultationKey(c.id), c);
  await client().lpush(userConsultationsKey(c.userId), c.id);
}

export async function getConsultationsForUser(userId: string): Promise<Consultation[]> {
  const ids = await client().lrange(userConsultationsKey(userId), 0, -1);
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getJSON<Consultation>(consultationKey(id))));
  return results.filter((c): c is Consultation => c !== null);
}

export interface DietitianApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  qualification: string;
  experienceYears: number;
  specializations: string[];
  languages: string[];
  location: string;
  fee: string;
  about: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const dietitianKey = (id: string) => `dietitian:${id}`;
const dietitianByUserKey = (userId: string) => `dietitian_user:${userId}`;

export async function createOrUpdateDietitianApplication(
  app: DietitianApplication
): Promise<void> {
  await setJSON(dietitianKey(app.id), app);
  await setJSON(dietitianByUserKey(app.userId), app.id);
}

export async function getDietitianApplicationByUserId(
  userId: string
): Promise<DietitianApplication | null> {
  const id = await getJSON<string>(dietitianByUserKey(userId));
  if (!id) return null;
  return getJSON<DietitianApplication>(dietitianKey(id));
}

export async function listAllDietitianApplications(): Promise<DietitianApplication[]> {
  const keys = await client().keys("dietitian:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<DietitianApplication>(k)));
  return results
    .filter((d): d is DietitianApplication => d !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listApprovedDietitians(): Promise<DietitianApplication[]> {
  const all = await listAllDietitianApplications();
  return all.filter((d) => d.status === "approved");
}

export async function setDietitianStatus(
  id: string,
  status: DietitianApplication["status"]
): Promise<void> {
  const app = await getJSON<DietitianApplication>(dietitianKey(id));
  if (!app) return;
  app.status = status;
  await setJSON(dietitianKey(id), app);
}

// --- Admin-only reads (used only by /admin, gated by ADMIN_EMAILS) ---

export async function listAllUsers(): Promise<User[]> {
  const keys = await client().keys("user_id:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<User>(k)));
  return results.filter((u): u is User => u !== null);
}

export async function listAllConsultations(): Promise<Consultation[]> {
  const keys = await client().keys("consultation:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<Consultation>(k)));
  return results
    .filter((c): c is Consultation => c !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markConsultationReviewed(id: string): Promise<void> {
  const c = await getJSON<Consultation>(consultationKey(id));
  if (!c) return;
  c.status = "reviewed";
  await setJSON(consultationKey(id), c);
}
