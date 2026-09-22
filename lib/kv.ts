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

export async function getDietitianApplicationById(
  id: string
): Promise<DietitianApplication | null> {
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

export async function deleteDietitianApplication(id: string): Promise<void> {
  const app = await getJSON<DietitianApplication>(dietitianKey(id));
  await client().del(dietitianKey(id));
  if (app) await client().del(dietitianByUserKey(app.userId));
}

// --- Appointments ---

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  dietitianId: string;
  dietitianName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  status: "booked" | "cancelled";
  createdAt: string;
}

const appointmentKey = (id: string) => `appointment:${id}`;
const userAppointmentsKey = (userId: string) => `user_appointments:${userId}`;
const dietitianAppointmentsKey = (dietitianId: string) => `dietitian_appointments:${dietitianId}`;

export async function isSlotTaken(dietitianId: string, date: string, time: string): Promise<boolean> {
  const ids = await client().lrange(dietitianAppointmentsKey(dietitianId), 0, -1);
  if (ids.length === 0) return false;
  const appts = await Promise.all(ids.map((id) => getJSON<Appointment>(appointmentKey(id))));
  return appts.some((a) => a && a.status === "booked" && a.date === date && a.time === time);
}

export async function createAppointment(a: Appointment): Promise<void> {
  await setJSON(appointmentKey(a.id), a);
  await client().lpush(userAppointmentsKey(a.userId), a.id);
  await client().lpush(dietitianAppointmentsKey(a.dietitianId), a.id);
}

export async function getAppointmentsForUser(userId: string): Promise<Appointment[]> {
  const ids = await client().lrange(userAppointmentsKey(userId), 0, -1);
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getJSON<Appointment>(appointmentKey(id))));
  return results.filter((a): a is Appointment => a !== null);
}

export async function getAppointmentsForDietitian(dietitianId: string): Promise<Appointment[]> {
  const ids = await client().lrange(dietitianAppointmentsKey(dietitianId), 0, -1);
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getJSON<Appointment>(appointmentKey(id))));
  return results.filter((a): a is Appointment => a !== null);
}

export async function listAllAppointments(): Promise<Appointment[]> {
  const keys = await client().keys("appointment:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<Appointment>(k)));
  return results
    .filter((a): a is Appointment => a !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Editable site content (Dr. Astha's profile, hero stat, etc.) ---
// Lets the site owner update real text/photos from /admin/content
// instead of asking for a code change every time.

export interface SectionVisibility {
  stats: boolean;
  goals: boolean;
  about: boolean;
  conditions: boolean;
  how: boolean;
  dietitian: boolean;
  testimonials: boolean;
  join: boolean;
  oncology: boolean;
}

export interface SiteContent {
  asthaName: string;
  asthaRole: string;
  asthaQuote: string;
  asthaBio: string;
  asthaQualifications: string;
  asthaPhotoUrl: string;
  heroStatNumber: string;
  heroStatLabel: string;
  heroImageUrl: string;
  heroImageUrl2: string;
  heroImageUrl3: string;
  goalLabels: string[];
  logoUrlLight: string;
  logoUrlDark: string;
  themeAccentColor: string;
  themeButtonColor: string;
  heroTextOffsetY: number;
  finalCtaImageUrl: string;
  approachImageUrl: string;
  processImages: string[];
  conditionImages: string[];
  goalImages: string[];
  popupEnabled: boolean;
  popupMessage: string;
  popupCtaText: string;
  popupCtaLink: string;
  popupTrigger: "scroll" | "time";
  popupTriggerValue: number;
  popupImageUrl: string;
  popupHeadline: string;
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  linkedinUrl: string;
  // Oncology / Cancer Care banner — shown on its own page, as a homepage
  // section, in the nav menu, and in the footer, all gated by the one
  // sectionsEnabled.oncology toggle.
  oncologyImageUrl: string;
  oncologyTitle: string;
  oncologySubtitle: string;
  oncologyButtonText: string;
  // Paid 1:1 dietitian consultation upsell shown after a free plan is
  // generated. No card gateway is wired up — this is the same manual
  // UPI flow used elsewhere on the site: the visitor sees the price,
  // pays via UPI on their own, then confirms, and it lands as a message
  // for the team to follow up on.
  premiumOriginalPrice: string;
  premiumDiscountedPrice: string;
  premiumUpiId: string;
  sectionsEnabled: SectionVisibility;
}

const SITE_CONTENT_KEY = "site_content";

const DEFAULT_CONTENT: SiteContent = {
  asthaName: "Dr. Astha Jadeja",
  asthaRole: "Founder & Lead Dietitian",
  asthaQuote:
    "Nutrition guidance should feel like it was written for your kitchen — not translated from someone else's.",
  asthaBio:
    "Dr. Astha Jadeja leads the nutrition philosophy behind Health365 — practical, judgement-free guidance built for real Indian kitchens and real routines.",
  asthaQualifications:
    "Qualifications & credentials placeholder — connect Dr. Astha's verified details here before launch.",
  asthaPhotoUrl: "",
  heroStatNumber: "10K+",
  heroStatLabel: "People supported with real nutrition guidance",
  heroImageUrl: "",
  heroImageUrl2: "",
  heroImageUrl3: "",
  goalLabels: ["Lose Weight", "Gain Weight", "Eat Better", "Manage a Condition"],
  logoUrlLight: "",
  logoUrlDark: "",
  themeAccentColor: "#E7F0DC",
  themeButtonColor: "#20241F",
  heroTextOffsetY: 0,
  finalCtaImageUrl: "",
  approachImageUrl: "",
  processImages: ["", "", "", ""],
  conditionImages: ["", "", "", "", "", ""],
  goalImages: ["", "", "", ""],
  popupEnabled: false,
  popupMessage: "",
  popupCtaText: "Start Free Consultation",
  popupCtaLink: "/consultation",
  popupTrigger: "time",
  popupTriggerValue: 3,
  siteTitle: "Health365",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
  instagramUrl: "",
  youtubeUrl: "",
  pinterestUrl: "",
  linkedinUrl: "",
  popupImageUrl: "",
  popupHeadline: "",
  oncologyImageUrl: "",
  oncologyTitle: "Cancer care nutrition, personalized for you",
  oncologySubtitle: "Gentle, practical, judgement-free nutrition guidance for people navigating cancer treatment and recovery — shaped around your appetite, energy, and treatment schedule.",
  oncologyButtonText: "Talk to an Oncology Dietitian",
  premiumOriginalPrice: "2500",
  premiumDiscountedPrice: "1500",
  premiumUpiId: "",
  sectionsEnabled: {
    stats: true,
    goals: true,
    about: true,
    conditions: true,
    how: true,
    dietitian: true,
    testimonials: true,
    join: true,
    oncology: true,
  },
};

export async function getSiteContent(): Promise<SiteContent> {
  const stored = await getJSON<Partial<SiteContent>>(SITE_CONTENT_KEY);
  return {
    ...DEFAULT_CONTENT,
    ...(stored || {}),
    // Shallow-merged above would drop any section key missing from an older
    // saved record (e.g. right after this field is introduced) — merge it
    // one level deeper so a partial/missing sectionsEnabled still defaults
    // every individual section to visible.
    sectionsEnabled: { ...DEFAULT_CONTENT.sectionsEnabled, ...(stored?.sectionsEnabled || {}) },
  };
}

export async function setSiteContent(content: SiteContent): Promise<void> {
  await setJSON(SITE_CONTENT_KEY, content);
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

export async function deleteConsultation(id: string): Promise<void> {
  const c = await getJSON<Consultation>(consultationKey(id));
  await client().del(consultationKey(id));
  if (c) await client().lrem(userConsultationsKey(c.userId), 0, id);
}

export async function deleteAppointment(id: string): Promise<void> {
  const a = await getJSON<Appointment>(appointmentKey(id));
  await client().del(appointmentKey(id));
  if (a) {
    await client().lrem(userAppointmentsKey(a.userId), 0, id);
    await client().lrem(dietitianAppointmentsKey(a.dietitianId), 0, id);
  }
}

export async function updateAppointmentStatus(id: string, status: "booked" | "cancelled"): Promise<void> {
  const a = await getJSON<Appointment>(appointmentKey(id));
  if (!a) return;
  a.status = status;
  await setJSON(appointmentKey(id), a);
}

// --- Newsletter signups ---

export async function addNewsletterSubscriber(email: string): Promise<void> {
  await client().sadd("newsletter_subscribers", email.toLowerCase());
}

export async function listNewsletterSubscribers(): Promise<string[]> {
  return client().smembers("newsletter_subscribers");
}

// --- Testimonials (admin-entered, real, published-controlled) ---

export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g. "Lost 8kg in 6 months" or "Managing PCOS"
  quote: string;
  rating: number; // 1-5
  photoUrl: string;
  published: boolean;
  createdAt: string;
}

const testimonialKey = (id: string) => `testimonial:${id}`;

export async function saveTestimonial(t: Testimonial): Promise<void> {
  await setJSON(testimonialKey(t.id), t);
}

export async function listAllTestimonials(): Promise<Testimonial[]> {
  const keys = await client().keys("testimonial:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<Testimonial>(k)));
  return results
    .filter((t): t is Testimonial => t !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listPublishedTestimonials(): Promise<Testimonial[]> {
  const all = await listAllTestimonials();
  return all.filter((t) => t.published);
}

export async function setTestimonialPublished(id: string, published: boolean): Promise<void> {
  const t = await getJSON<Testimonial>(testimonialKey(id));
  if (!t) return;
  t.published = published;
  await setJSON(testimonialKey(id), t);
}

export async function deleteTestimonial(id: string): Promise<void> {
  await client().del(testimonialKey(id));
}

// --- Contact messages (contact-page form + the floating chat widget) ---
// Both feed the same store so the admin can see every incoming message
// in one place, regardless of which one someone used.

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  source: "contact_form" | "chat_widget" | "premium_consult";
  read: boolean;
  createdAt: string;
}

const contactMessageKey = (id: string) => `contact_message:${id}`;

export async function saveContactMessage(m: ContactMessage): Promise<void> {
  await setJSON(contactMessageKey(m.id), m);
}

export async function listAllContactMessages(): Promise<ContactMessage[]> {
  const keys = await client().keys("contact_message:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<ContactMessage>(k)));
  return results
    .filter((m): m is ContactMessage => m !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markContactMessageRead(id: string, read: boolean): Promise<void> {
  const m = await getJSON<ContactMessage>(contactMessageKey(id));
  if (!m) return;
  m.read = read;
  await setJSON(contactMessageKey(id), m);
}

export async function deleteContactMessage(id: string): Promise<void> {
  await client().del(contactMessageKey(id));
}

// --- Admin-authored diet plan templates ---
// A short, hand-written day of meals the owner enters once per goal/
// condition (e.g. "Lose Weight", "Diabetes"). When a visitor picks that
// goal/condition on the diet-plan page, this is used instead of the
// randomly-assembled plan from mealPool.ts — both on screen and in the
// downloaded PDF.

export interface DietTemplateMeal {
  name: string;
  portion: string;
  cal: string;
  note: string; // shown as "Alternative / tip"
}

export interface DietTemplate {
  key: string; // slug — see lib/dietConditions.ts for the fixed list
  tips: string; // short general note shown under the meals
  meals: Record<string, DietTemplateMeal>; // slot -> meal (slots: breakfast, midmorning, lunch, eveningsnack, dinner)
  updatedAt: string;
}

const dietTemplateKey = (key: string) => `diet_template:${key}`;

export async function getDietTemplate(key: string): Promise<DietTemplate | null> {
  return getJSON<DietTemplate>(dietTemplateKey(key));
}

export async function setDietTemplate(t: DietTemplate): Promise<void> {
  await setJSON(dietTemplateKey(t.key), t);
}

export async function listAllDietTemplates(): Promise<DietTemplate[]> {
  const keys = await client().keys("diet_template:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<DietTemplate>(k)));
  return results.filter((t): t is DietTemplate => t !== null);
}

// --- Admin accounts with per-section permissions ---
// The site owner (whoever's email is in the ADMIN_EMAILS env var) is
// always a full super-admin and never needs a record here. Everyone
// else who should get into /admin — a dietitian handling testimonials,
// someone managing diet templates, etc. — gets one of these records,
// naming exactly which admin sections they can open. They still log in
// with their normal email/password (the same account used on the rest
// of the site); this record only grants the extra admin-panel access.

export interface AdminAccount {
  email: string; // lowercase — also the record's key
  name: string;
  permissions: string[]; // subset of the keys in lib/admin.ts's ADMIN_PERMISSIONS
  addedAt: string;
}

const adminAccountKey = (email: string) => `admin_account:${email.toLowerCase()}`;

export async function getAdminAccount(email: string): Promise<AdminAccount | null> {
  return getJSON<AdminAccount>(adminAccountKey(email));
}

export async function saveAdminAccount(a: AdminAccount): Promise<void> {
  await setJSON(adminAccountKey(a.email), { ...a, email: a.email.toLowerCase() });
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const keys = await client().keys("admin_account:*");
  if (keys.length === 0) return [];
  const results = await Promise.all(keys.map((k) => getJSON<AdminAccount>(k)));
  return results
    .filter((a): a is AdminAccount => a !== null)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function deleteAdminAccount(email: string): Promise<void> {
  await client().del(adminAccountKey(email));
}
