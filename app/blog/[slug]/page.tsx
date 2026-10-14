import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPost, listPublishedPosts } from "@/lib/blog";
import "../blog.css";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPost(params.slug).catch(() => null);
  if (!p || !p.published) return { title: "Blog | Health365" };
  return {
    title: `${p.title} | Health365`,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.excerpt, type: "article", images: p.coverUrl ? [p.coverUrl] : undefined },
  };
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const p = await getPost(params.slug).catch(() => null);
  if (!p || !p.published) notFound();
  const more = (await listPublishedPosts().catch(() => [])).filter((x) => x.slug !== p.slug).slice(0, 2);

  return (
    <>
      <SiteHeader />
      <main className="bl">
        <article className="ar">
          <Link href="/blog" className="ar-back">← All posts</Link>
          <div className="ar-hero" style={{ background: p.color }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.coverUrl ? <img src={p.coverUrl} alt="" /> : <span aria-hidden>{p.emoji}</span>}
          </div>
          <span className="bl-eyebrow" style={{ marginTop: 24 }}>{p.tag}</span>
          <h1>{p.title}</h1>
          <p className="ar-meta">{p.author} · {p.readMins} min read · {fmt(p.createdAt)}</p>
          {p.excerpt && <p className="ar-ex">{p.excerpt}</p>}
          <div className="ar-content">
            {p.blocks.map((b, i) => {
              if (b.type === "h") return <h2 key={i}>{b.text}</h2>;
              if (b.type === "list") return <ul key={i}>{(b.items || []).filter(Boolean).map((x, k) => <li key={k}>{x}</li>)}</ul>;
              if (b.type === "tip") return <p key={i} className="ar-tip">{b.text}</p>;
              if (b.type === "quote") return <blockquote key={i} className="ar-quote">“{b.text}”<span>— Health365 Dietitian</span></blockquote>;
              if (b.type === "img" && b.url) return (
                <figure key={i} className="ar-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.url} alt={b.text || ""} loading="lazy" />
                  {b.text && <figcaption>{b.text}</figcaption>}
                </figure>
              );
              return <p key={i}>{b.text}</p>;
            })}
          </div>
          <p className="ar-note">General wellness information, not medical advice. If you have a health condition, talk to your doctor or dietitian before changing your diet.</p>
          <div className="ar-cta">
            <div>
              <h3>Want a plan built around you?</h3>
              <p>Talk 1:1 with a Health365 dietitian — real Indian food, your routine.</p>
            </div>
            <Link href="/consultation">Book a consultation</Link>
          </div>
          {more.length > 0 && (
            <div className="ar-more">
              <h3>Keep reading</h3>
              <div className="bl-grid" style={{ marginTop: 0, gridTemplateColumns: "1fr 1fr" }}>
                {more.map((m) => (
                  <Link key={m.slug} href={`/blog/${m.slug}`} className="bl-card">
                    <div className="bl-thumb" style={{ background: m.color, aspectRatio: "16/9" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {m.coverUrl ? <img src={m.coverUrl} alt="" loading="lazy" /> : <span aria-hidden>{m.emoji}</span>}
                      <span className="bl-tag">{m.tag}</span>
                    </div>
                    <div className="bl-body"><h2 style={{ fontSize: "1rem" }}>{m.title}</h2></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
