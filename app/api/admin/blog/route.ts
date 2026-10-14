import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { listPosts, getPost, savePost, deletePost, slugify, estimateReadMins, BlogPost, BlogBlock, BlogBlockType } from "@/lib/blog";

const PALETTE = ["#4EAA67", "#287379", "#E5394F", "#CBDB3D", "#F6961D", "#9997C9"];
const TYPES: BlogBlockType[] = ["p", "h", "list", "tip", "quote", "img"];
const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const url = (v: unknown) => (/^https?:\/\//i.test(txt(v, 600)) || /^\/[\w\-./]+$/.test(txt(v, 600)) ? txt(v, 600) : "");

export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "blog"))) return denied();
  return NextResponse.json({ posts: await listPosts() });
}

export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "blog");
  if (!session) return denied();
  const b = await req.json().catch(() => null);
  const title = txt(b?.title, 120);
  if (!title) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  const slug = slugify(txt(b?.slug, 80) || title);
  if (!slug) return NextResponse.json({ error: "Please add a title with letters or numbers." }, { status: 400 });
  const oldSlug = txt(b?.oldSlug, 80);
  if (slug !== oldSlug && (await getPost(slug))) {
    return NextResponse.json({ error: `Another post already uses the link "${slug}". Change the title or link.` }, { status: 409 });
  }
  const prev = oldSlug ? await getPost(oldSlug) : null;
  const blocks: BlogBlock[] = (Array.isArray(b?.blocks) ? b.blocks : []).slice(0, 60).map((x: Record<string, unknown>) => ({
    type: TYPES.includes(x.type as BlogBlockType) ? (x.type as BlogBlockType) : "p",
    text: txt(x.text, 3000),
    items: Array.isArray(x.items) ? (x.items as unknown[]).map((i) => txt(i, 400)).filter(Boolean).slice(0, 20) : undefined,
    url: x.type === "img" ? url(x.url) : undefined,
  })).filter((x: BlogBlock) => x.text || (x.items && x.items.length) || x.url);
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: prev?.id && !prev.id.startsWith("starter-") ? prev.id : crypto.randomUUID().slice(0, 10),
    slug,
    title,
    excerpt: txt(b?.excerpt, 300),
    tag: txt(b?.tag, 20) || "Habit",
    coverUrl: url(b?.coverUrl),
    color: PALETTE.includes(String(b?.color)) ? String(b.color) : "#4EAA67",
    emoji: txt(b?.emoji, 8) || "🌿",
    author: txt(b?.author, 60) || "Health365 Nutrition Team",
    readMins: 1,
    blocks,
    published: Boolean(b?.published),
    showInApp: b?.showInApp === undefined ? true : Boolean(b.showInApp),
    featured: Boolean(b?.featured),
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  };
  post.readMins = estimateReadMins(post);
  await savePost(post, oldSlug || undefined);
  try { revalidatePath("/blog"); revalidatePath(`/blog/${slug}`); } catch {}
  return NextResponse.json({ ok: true, post });
}

export async function DELETE(req: NextRequest) {
  if (!(await adminFromRequest(req, "blog"))) return denied();
  const b = await req.json().catch(() => null);
  const slug = txt(b?.slug, 80);
  if (slug) await deletePost(slug);
  try { revalidatePath("/blog"); } catch {}
  return NextResponse.json({ ok: true });
}
