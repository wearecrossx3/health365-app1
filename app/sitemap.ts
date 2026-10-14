import { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in";
  const routes = [
    "",
    "/conditions",
    "/dietitians",
    "/consultation",
    "/diet-plan",
    "/app",
    "/blog",
    "/join-as-dietitian",
    "/privacy",
    "/terms",
    "/contact",
  ];
  const posts = await listPublishedPosts().catch(() => []);
  return [
    ...routes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
