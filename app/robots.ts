import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://health365-app1.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/dietitian-dashboard", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
