import { NextRequest } from "next/server";
import { appJson, appPreflight } from "@/lib/appApi";
import { listPublishedPosts, getPost } from "@/lib/blog";

// Blog for the app: GET → list of posts; GET ?slug=… → one full post.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return appPreflight();
}

const summary = (p: Awaited<ReturnType<typeof listPublishedPosts>>[number]) => ({
  slug: p.slug, title: p.title, excerpt: p.excerpt, tag: p.tag, coverUrl: p.coverUrl, color: p.color, emoji: p.emoji, readMins: p.readMins, featured: p.featured, createdAt: p.createdAt,
});

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const p = await getPost(slug.slice(0, 80));
    if (!p || !p.published) return appJson({ error: "Post not found." }, 404);
    return appJson({ post: p });
  }
  const posts = (await listPublishedPosts()).filter((p) => p.showInApp);
  return appJson({ posts: posts.map(summary) });
}
