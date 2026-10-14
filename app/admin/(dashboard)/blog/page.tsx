import { requireAdminPage } from "@/lib/adminGuard";
import { listPosts } from "@/lib/blog";
import BlogManager from "./BlogManager";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requireAdminPage("blog");
  const posts = await listPosts();
  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "48px 24px" }}>
      <div className="wrap" style={{ maxWidth: 860, padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Blog</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Posts appear on the website at /blog and inside the app. The app&apos;s &quot;Small choices, better habits&quot; cards open
            these posts — set which card opens which post in Mobile App → Habit cards. &quot;New post from template&quot; gives you the
            same simple structure every time.
          </p>
        </div>
        <BlogManager initial={posts} />
      </div>
    </main>
  );
}
