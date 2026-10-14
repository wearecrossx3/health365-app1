import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { listPublishedPosts } from "@/lib/blog";
import "./blog.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog — Small choices, better habits | Health365",
  description: "Simple, practical nutrition habits for Indian kitchens — one small change at a time, from the Health365 dietitians.",
  alternates: { canonical: "/blog" },
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function BlogIndex() {
  const posts = await listPublishedPosts().catch(() => []);
  const sorted = [...posts].sort((a, b) => Number(b.featured) - Number(a.featured));
  // A wide first card only when it leaves the 3-column grid without gaps.
  const bigFirst = sorted.length >= 2 && (sorted.length - 2) % 3 !== 1;
  return (
    <>
      <SiteHeader />
      <main className="bl">
        <div className="bl-wrap">
          <span className="bl-eyebrow">Health365 Blog</span>
          <h1 className="bl-h1">Small choices,<br />better habits.</h1>
          <p className="bl-lead">One practical change at a time — built for Indian kitchens, real routines and real families. No fads, no fear.</p>
          {sorted.length === 0 && <p style={{ marginTop: 40 }}>New posts are on the way.</p>}
          <div className="bl-grid">
            {sorted.map((p, i) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={`bl-card${i === 0 && bigFirst ? " bl-feat" : ""}`}>
                <div className="bl-thumb" style={{ background: p.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.coverUrl ? <img src={p.coverUrl} alt="" loading="lazy" /> : <span aria-hidden>{p.emoji}</span>}
                  <span className="bl-tag">{p.tag}</span>
                </div>
                <div className="bl-body">
                  <h2>{p.title}</h2>
                  <p>{p.excerpt}</p>
                  <span className="bl-meta">{p.readMins} min read · {fmt(p.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
