import { redis, getJSON, setJSON } from "./kv";

// Blog posts (Admin → Blog). Shown on the website at /blog and inside the
// app (the dashboard's "Small choices, better habits" cards open a post).
// A post body is a list of simple blocks so a non-technical admin can build
// it with buttons instead of writing HTML.

export type BlogBlockType = "p" | "h" | "list" | "tip" | "quote" | "img";

export interface BlogBlock {
  type: BlogBlockType;
  text: string; // paragraph / heading / tip / quote text, or image caption
  items?: string[]; // for "list"
  url?: string; // for "img"
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string; // small pill: "Habit", "Seeds", "Move", "Kitchen"…
  coverUrl: string;
  color: string; // accent / card colour when there's no cover photo
  emoji: string; // shown on the card when there's no cover photo
  author: string;
  readMins: number;
  blocks: BlogBlock[];
  published: boolean;
  showInApp: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

const postKey = (slug: string) => `blog:${slug}`;

export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateReadMins(p: Pick<BlogPost, "blocks" | "excerpt">): number {
  const words = [p.excerpt, ...p.blocks.map((b) => [b.text, ...(b.items || [])].join(" "))].join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const p = await getJSON<BlogPost>(postKey(slug));
  if (p) return p;
  const starterPost = STARTER_POSTS.find((s) => s.slug === slug);
  if (starterPost && !(await isStarterHidden(slug))) return starterPost;
  return null;
}

export async function savePost(p: BlogPost, oldSlug?: string): Promise<void> {
  if (oldSlug && oldSlug !== p.slug) await redis().del(postKey(oldSlug));
  await setJSON(postKey(p.slug), p);
}

export async function deletePost(slug: string): Promise<void> {
  await redis().del(postKey(slug));
  if (STARTER_POSTS.some((s) => s.slug === slug)) await redis().sadd("blog_starter_hidden", slug);
}

async function isStarterHidden(slug: string): Promise<boolean> {
  return (await redis().sismember("blog_starter_hidden", slug)) === 1;
}

// All posts, newest first. The four starter posts are included until the
// admin edits (which saves them for real) or deletes them.
export async function listPosts(): Promise<BlogPost[]> {
  const keys = await redis().keys("blog:*");
  const saved = (await Promise.all(keys.map((k) => getJSON<BlogPost>(k)))).filter((p): p is BlogPost => !!p);
  const hidden = new Set(await redis().smembers("blog_starter_hidden"));
  const starters = STARTER_POSTS.filter((s) => !hidden.has(s.slug) && !saved.some((p) => p.slug === s.slug));
  return [...saved, ...starters].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listPublishedPosts(): Promise<BlogPost[]> {
  return (await listPosts()).filter((p) => p.published);
}

// ——— The blog template ———
// Same voice and structure as the app's "Small choices, better habits"
// cards: one small habit, why it helps, how to start, a try-today tip and a
// dietitian's note. "New post from template" in admin starts from this.
export function templateBlocks(): BlogBlock[] {
  return [
    { type: "p", text: "One small change, explained simply — and how to fit it into a normal Indian day." },
    { type: "h", text: "Why it helps" },
    { type: "p", text: "Explain the reason in 2–3 short sentences. Keep it practical and kind — no fear, no jargon." },
    { type: "h", text: "How to start" },
    { type: "list", text: "", items: ["Step one — the smallest possible version", "Step two — where it fits in your day", "Step three — how to keep it going"] },
    { type: "tip", text: "Try this today: one specific, doable action the reader can take before dinner." },
    { type: "quote", text: "A short, warm note from the dietitian — the 'why this matters' in one line." },
  ];
}

const T = "2026-10-01T09:00:00.000Z";
const starter = (p: Partial<BlogPost> & Pick<BlogPost, "slug" | "title" | "excerpt" | "tag" | "blocks" | "emoji" | "color">, i: number): BlogPost => ({
  id: `starter-${i}`,
  coverUrl: "",
  author: "Health365 Nutrition Team",
  readMins: 0,
  published: true,
  showInApp: true,
  featured: i === 1,
  createdAt: new Date(new Date(T).getTime() - i * 86400000).toISOString(),
  updatedAt: T,
  ...p,
});

export const STARTER_POSTS: BlogPost[] = [
  starter({
    slug: "add-seeds-to-your-day",
    title: "Add 1 tablespoon of seeds to your day",
    excerpt: "Flax, pumpkin, sunflower or til — a spoonful of seeds is the easiest upgrade your thali will ever get.",
    tag: "Seeds",
    emoji: "🌻",
    color: "#CBDB3D",
    blocks: [
      { type: "p", text: "You don't need a new diet to eat better. Sometimes it's a single spoon. Seeds bring fibre, plant protein and healthy fats in a tiny serving — and they fit into food you already eat." },
      { type: "h", text: "Why it helps" },
      { type: "p", text: "Seeds are small but dense. Flax seeds are one of the richest plant sources of omega-3 fats; pumpkin and sunflower seeds add protein and minerals like magnesium and zinc; til (sesame) adds calcium. The fibre helps you stay full for longer and keeps digestion regular." },
      { type: "h", text: "How to start" },
      { type: "list", text: "", items: ["Start with 1 tablespoon a day — not more. Seeds are healthy but calorie-dense.", "Grind flax seeds fresh (or buy roasted ground alsi) — whole flax often passes through undigested.", "Stir into curd, sprinkle on poha or salad, or knead into your roti dough.", "Drink an extra glass of water — more fibre needs more water."] },
      { type: "tip", text: "Try this today: dry-roast a mix of flax, pumpkin and sunflower seeds, cool it and keep a jar next to the masala dabba. One spoon on lunch, every day." },
      { type: "quote", text: "Healthy eating isn't about removing things. Often it's about adding one good thing and letting it stay." },
    ],
  }, 1),
  starter({
    slug: "start-lunch-with-salad",
    title: "Start lunch with a bowl of salad",
    excerpt: "Eat the kachumber first, then the roti and rice. Same thali, smarter order.",
    tag: "Habit",
    emoji: "🥗",
    color: "#4EAA67",
    blocks: [
      { type: "p", text: "This one doesn't ask you to give up anything. Same lunch — you just change the order and start with a bowl of raw vegetables." },
      { type: "h", text: "Why it helps" },
      { type: "p", text: "Vegetables are high in fibre and water and low in calories, so they take up room and slow you down. Eating vegetables before carbohydrates has been shown to soften the rise in blood sugar after a meal — useful for everyone, and especially for diabetes and PCOS." },
      { type: "h", text: "How to start" },
      { type: "list", text: "", items: ["Cucumber, tomato, onion, carrot, a squeeze of lemon and a pinch of chaat masala — that's enough.", "Fill one katori and finish it before the roti or rice.", "Add sprouts or a spoon of roasted peanuts on busy days for protein."] },
      { type: "tip", text: "Try this today: chop the salad while the dal is cooking, so it's already on the table when you sit down." },
      { type: "quote", text: "The order of your plate matters almost as much as what's on it." },
    ],
  }, 2),
  starter({
    slug: "10-minute-walk-after-dinner",
    title: "A 10-minute walk after dinner",
    excerpt: "Not a workout — just a stroll. It helps your body use the sugar from the meal you just ate.",
    tag: "Move",
    emoji: "🚶",
    color: "#287379",
    blocks: [
      { type: "p", text: "In many Indian homes, the after-dinner walk — the shatapavali — is an old habit. Science agrees with grandma here." },
      { type: "h", text: "Why it helps" },
      { type: "p", text: "When your muscles move, they pull sugar out of the blood to use as fuel. A light walk soon after a meal helps flatten the post-meal sugar spike and can help digestion feel lighter, too." },
      { type: "h", text: "How to start" },
      { type: "list", text: "", items: ["Walk within 30 minutes of finishing dinner.", "10 minutes at an easy pace is enough — around the building, the terrace or even inside the house.", "Make it a family habit: phones in pockets, conversation on."] },
      { type: "tip", text: "Try this today: set a 'walk' reminder for 15 minutes after your usual dinner time." },
      { type: "quote", text: "Consistency beats intensity. A short walk every day does more than one long walk a week." },
    ],
  }, 3),
  starter({
    slug: "swap-fried-snack-for-roasted-chana",
    title: "Swap one fried snack for roasted chana",
    excerpt: "Same 4 pm crunch, a lot more protein and fibre. One swap this week is enough.",
    tag: "Kitchen",
    emoji: "🫘",
    color: "#F6961D",
    blocks: [
      { type: "p", text: "Evening chai and something crunchy is a ritual we're not going to fight. We'll just change what's crunching." },
      { type: "h", text: "Why it helps" },
      { type: "p", text: "Roasted chana is a whole legume: it brings plant protein and fibre, which keep you full till dinner. Most fried namkeen is mostly refined flour and oil, which adds calories without keeping you full." },
      { type: "h", text: "How to start" },
      { type: "list", text: "", items: ["Keep a small dabba of roasted chana where the namkeen used to be.", "Toss with a pinch of salt, haldi and chilli powder — or mix with puffed rice and peanuts.", "One handful is a portion. Use a small katori, not the packet."] },
      { type: "tip", text: "Try this today: replace only one snack this week. Next week, swap one more." },
      { type: "quote", text: "Small swaps you can keep are better than big rules you'll break." },
    ],
  }, 4),
].map((p) => ({ ...p, readMins: estimateReadMins(p) }));
