import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thehealth365.in";
  const routes = [
    "",
    "/conditions",
    "/dietitians",
    "/consultation",
    "/diet-plan",
    "/app",
    "/join-as-dietitian",
    "/privacy",
    "/terms",
    "/contact",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}
