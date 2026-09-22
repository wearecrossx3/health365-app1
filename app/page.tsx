import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import GoalCards from "@/components/GoalCards";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import HeroSlider from "@/components/HeroSlider";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import OncologyBanner from "@/components/OncologyBanner";
import { getSiteContent, listPublishedTestimonials } from "@/lib/kv";

// Force this page to check the database fresh on every visit instead of
// caching a static version — otherwise changes made in /admin/content
// wouldn't show up on the live homepage without a full redeploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getSiteContent();
  const testimonials = await listPublishedTestimonials();
  function imgStyle(url: string) {
    return url ? { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined;
  }
  return (
    <>
      <SiteHeader />

      <main id="top">
        {/* HERO */}
        <div
          className={`hero-full${content.heroImageUrl || content.heroImageUrl2 || content.heroImageUrl3 ? "" : " ph-teal grain"}`}
          id="hero"
          style={{ position: "relative", justifyContent: content.heroTextOffsetY < 0 ? "flex-start" : content.heroTextOffsetY > 0 ? "flex-end" : "center" }}
        >
          <HeroSlider images={[content.heroImageUrl, content.heroImageUrl2, content.heroImageUrl3]} />
          <span className="hero-full-kicker"><span className="dot" />Nutrition &amp; Real Life</span>
          <div className="hero-full-content">
            <div className="hero-full-grid">
              <div>
                <h1 className="hero-full-title">Your health,<br />your 365.</h1>
              </div>
              <div className="hero-full-right">
                <p className="hero-full-sub">Small choices. Better habits. A healthier relationship with food — built around you, not a template.</p>
                <Link href="/consultation" className="hero-full-cta">
                  Book a Consultation <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-full-stat-wrap">
            <div className="hero-full-stat">
              <div className="avatar-stack">
                <span>🧑</span><span>👩</span><span>🧑‍🦱</span>
              </div>
              <div>
                <span className="num">{content.heroStatNumber}</span>
                <span className="lbl">{content.heroStatLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        {content.sectionsEnabled.stats && (
        <div className="wrap">
          <Reveal className="luma-stats-row">
            <div className="luma-stats-nums">
              <div className="luma-stat"><b>365</b><p>Days of guidance, not a one-time chart.</p></div>
              <div className="luma-stat"><b>6+</b><p>Conditions covered with dietitian-reviewed guidance.</p></div>
              <div className="luma-stat"><b>1:1</b><p>Consultations shaped around your kitchen.</p></div>
            </div>
            <Link href="/contact" className="luma-ask">
              <div><p>Have a nutrition question?</p><p>Talk to our care team</p></div>
              <span className="arrow-circle">→</span>
            </Link>
          </Reveal>
        </div>
        )}

        {/* GOALS */}
        {content.sectionsEnabled.goals && (
        <section id="goals">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="luma-eyebrow">Get Started</span>
              <h2>What brings you here?</h2>
              <p>Pick a starting point — your consultation adapts around it.</p>
            </Reveal>
            <Reveal delay={120}>
              <GoalCards labels={content.goalLabels} />
            </Reveal>
          </div>
        </section>
        )}

        {/* ONCOLOGY */}
        {content.sectionsEnabled.oncology && (
        <section>
          <div className="wrap">
            <OncologyBanner
              imageUrl={content.oncologyImageUrl}
              title={content.oncologyTitle}
              subtitle={content.oncologySubtitle}
              buttonText={content.oncologyButtonText}
              buttonHref="/consultation?condition=Oncology"
            />
          </div>
        </section>
        )}

        {/* WHY US */}
        {content.sectionsEnabled.about && (
        <section style={{ background: "var(--paper)" }} id="about">
          <div className="wrap">
            <Reveal className="why-grid">
              <div className="photo ph-olive grain" style={{ aspectRatio: "6/5", position: "relative", ...imgStyle(content.approachImageUrl) }}>
                <div className="luma-quote-card">
                  <p>&quot;{content.asthaQuote}&quot;</p>
                </div>
              </div>
              <div>
                <span className="luma-eyebrow">A Different Kind of Approach</span>
                <h2 style={{ fontSize: "clamp(1.8rem,3.4vw,2.5rem)" }}>
                  Not another <span className="luma-highlight">diet chart.</span>
                </h2>
                <p style={{ marginTop: 16, fontSize: "1.02rem" }}>
                  A chart tells you what to eat today. We&apos;re built for the other 364 days.
                </p>
                <div className="luma-checklist">
                  <div className="item"><span className="icon">🥗</span><span className="label">Personalized guidance, shaped around your routine</span></div>
                  <div className="item"><span className="icon">🩺</span><span className="label">Dietitian-reviewed, grounded in real nutrition science</span></div>
                  <div className="item"><span className="icon">🇮🇳</span><span className="label">Built for Indian kitchens — real ingredients, real life</span></div>
                </div>
                <Link href="/dietitians" style={{ display: "inline-block", marginTop: 26, fontSize: ".9rem", fontWeight: 700, color: "var(--ink)" }}>
                  Meet our team →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
        )}

        {/* CONDITIONS */}
        {content.sectionsEnabled.conditions && (
        <section id="conditions">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="luma-eyebrow">Conditions</span>
              <h2>Made for real-life health goals.</h2>
              <p>General nutrition guidance for common conditions — always paired with an option to talk to a qualified dietitian.</p>
            </Reveal>
            <div className="icon-tile-grid">
              {[
                ["Diabetes", "🩸"],
                ["PCOS", "💜"],
                ["Thyroid", "🦋"],
                ["Weight Management", "⚖️"],
                ["Cholesterol", "❤️"],
                ["Digestive Health", "🌱"],
              ].map(([name, icon], i) => {
                const img = content.conditionImages[i];
                return (
                  <Link href="/conditions" className="icon-tile" key={name}>
                    <div className="icon-box">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={name} loading="lazy" />
                      ) : (
                        icon
                      )}
                    </div>
                    <span className="label">{name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* HOW IT WORKS */}
        {content.sectionsEnabled.how && (
        <section id="how" style={{ background: "var(--paper)" }}>
          <div className="wrap">
            <Reveal className="section-head">
              <span className="luma-eyebrow">Process</span>
              <h2>How Health365 works</h2>
              <p>Simple steps, built around your everyday life.</p>
            </Reveal>
            <Reveal delay={120} className="luma-minimal-steps">
              <div className="luma-step"><span className="icon-circle">📋</span><h3>Tell us about you</h3><p>A few minutes on your routine, food, and goals.</p></div>
              <div className="luma-step"><span className="icon-circle">🔍</span><h3>Understand your needs</h3><p>We look at the full picture, not just a number.</p></div>
              <div className="luma-step"><span className="icon-circle">📝</span><h3>Build your plan</h3><p>A meal structure shaped around your life.</p></div>
              <div className="luma-step"><span className="icon-circle">🔄</span><h3>Keep moving</h3><p>Adjust as you go, with a dietitian when needed.</p></div>
            </Reveal>
          </div>
        </section>
        )}

        {/* DIETITIAN */}
        {content.sectionsEnabled.dietitian && (
        <section id="dietitian">
          <div className="wrap">
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 28, padding: "48px" }}>
            <Reveal className="dietitian" style={{ position: "relative" }}>
              <div className="photo ph-terra grain" style={{ position: "relative", ...(content.asthaPhotoUrl ? { backgroundImage: `url(${content.asthaPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
                <div className="luma-quote-card">
                  <p>&quot;{content.asthaQuote}&quot;</p>
                </div>
              </div>
              <div>
                <span className="luma-eyebrow">Founder &amp; Lead Dietitian</span>
                <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>{content.asthaName}</h2>
                <span className="role" style={{ color: "var(--sage-deep)" }}>{content.asthaRole}</span>
                <p className="bio">{content.asthaBio}</p>
              </div>
            </Reveal>
            </div>
          </div>
        </section>
        )}

        {/* TESTIMONIALS */}
        {content.sectionsEnabled.testimonials && testimonials.length > 0 && (
          <section style={{ background: "var(--paper)" }}>
            <div className="wrap">
              <Reveal className="section-head">
                <span className="luma-eyebrow">What People Say</span>
                <h2>Real stories, real routines.</h2>
              </Reveal>
              <TestimonialsCarousel testimonials={testimonials} />
            </div>
          </section>
        )}

        {/* JOIN */}
        {content.sectionsEnabled.join && (
        <section>
          <div className="wrap">
            <Reveal className="join luma-sage-bg">
              <h2>Join Health365 as a Dietitian</h2>
              <Link href="/join-as-dietitian" className="luma-pill">Join as a Dietitian <span>→</span></Link>
            </Reveal>
          </div>
        </section>
        )}

      </main>

      <SiteFooter />
    </>
  );
}
