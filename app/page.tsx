import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import GoalCards from "@/components/GoalCards";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="top">
        {/* HERO */}
        <div className="hero" id="hero">
          <div className="wrap">
            <div className="hero-frame ph-teal grain">
              <div className="hero-top-tag">
                <span className="kicker-pill">Nutrition &amp; Real Life</span>
              </div>
              <div className="hero-bottom">
                <h1 className="hero-title">Your health,<br />your 365.</h1>
                <div className="stat-float">
                  <span className="num serif">10K+</span>
                  <p>People supported with real nutrition guidance</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-sub-row wrap">
            <p>Small choices. Better habits. A healthier relationship with food — built around you, not a template.</p>
            <div className="hero-ctas">
              <Link href="/consultation" className="btn btn-terracotta">Start Free Consultation</Link>
              <Link href="/#how" className="btn btn-outline">See How It Works</Link>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          <Reveal className="wrap stats-grid-3">
            <div className="stat"><span className="num serif">365</span><p>Days of guidance, not a one-time chart.</p></div>
            <div className="stat"><span className="num serif">6+</span><p>Conditions covered with dietitian-reviewed guidance.</p></div>
            <div className="stat"><span className="num serif">1:1</span><p>Consultations shaped around your kitchen.</p></div>
          </Reveal>
        </div>

        {/* GOALS */}
        <section id="goals">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="eyebrow">Get Started</span>
              <h2>What brings you here?</h2>
              <p>Pick a starting point — your consultation adapts around it.</p>
            </Reveal>
            <Reveal delay={120}>
              <GoalCards />
            </Reveal>
          </div>
        </section>

        {/* WHY US */}
        <section style={{ background: "var(--paper)" }} id="about">
          <div className="wrap">
            <Reveal className="why-grid">
              <div>
                <span className="eyebrow">Our Approach</span>
                <h2 style={{ fontSize: "clamp(1.8rem,3.4vw,2.5rem)" }}>
                  Not another <span className="italic">diet chart.</span>
                </h2>
                <p style={{ marginTop: 16, fontSize: "1.02rem" }}>
                  A chart tells you what to eat today. We&apos;re built for the other 364 days.
                </p>
                <div className="why-list">
                  <div className="why-item"><span className="ic">🥗</span><div><h3>Personalized guidance</h3><p>Shaped around your routine, not a template.</p></div></div>
                  <div className="why-item"><span className="ic">🩺</span><div><h3>Dietitian-reviewed</h3><p>Every plan is grounded in real nutrition science.</p></div></div>
                  <div className="why-item"><span className="ic">🇮🇳</span><div><h3>Built for Indian kitchens</h3><p>Real ingredients, real routines, real life.</p></div></div>
                </div>
              </div>
              <div className="photo ph-olive grain" style={{ aspectRatio: "6/5" }} />
            </Reveal>
          </div>
        </section>

        {/* CONDITIONS */}
        <section id="conditions">
          <div className="wrap">
            <Reveal className="section-head">
              <span className="eyebrow">Conditions</span>
              <h2>Made for real-life health goals.</h2>
              <p>General nutrition guidance for common conditions — always paired with an option to talk to a qualified dietitian.</p>
            </Reveal>
            <Reveal delay={120} className="service-grid service-grid-3col">
              {[
                ["Diabetes", "ph-teal", "Steadier meals, smarter carbs."],
                ["PCOS", "ph-rose", "Hormone-aware eating."],
                ["Thyroid", "ph-sand", "Support alongside treatment."],
                ["Weight Management", "ph-olive", "Sustainable change."],
                ["Cholesterol", "ph-terra", "Heart-friendly swaps."],
                ["Digestive Health", "ph-teal", "Gut-friendly meals."],
              ].map(([name, photo, tag]) => (
                <Link href="/conditions" className="service-card" key={name}>
                  <div className={`photo ${photo} grain`} style={{ aspectRatio: "5/4" }} />
                  <h3>{name}</h3>
                  <span className="pick">{tag}</span>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ background: "var(--paper)" }}>
          <div className="wrap">
            <Reveal className="section-head center">
              <span className="eyebrow">Process</span>
              <h2>How Health365 works</h2>
              <p style={{ marginLeft: "auto", marginRight: "auto" }}>Simple steps, built around your everyday life.</p>
            </Reveal>
            <Reveal delay={120} className="process-grid">
              <div className="process-card"><div className="photo ph-teal grain" /><h3>Tell us about you</h3><p>A few minutes on your routine, food, and goals.</p></div>
              <div className="process-card"><div className="photo ph-sand grain" /><h3>Understand your needs</h3><p>We look at the full picture, not just a number.</p></div>
              <div className="process-card"><div className="photo ph-terra grain" /><h3>Build your plan</h3><p>A meal structure shaped around your life.</p></div>
              <div className="process-card"><div className="photo ph-olive grain" /><h3>Keep moving</h3><p>Adjust as you go, with a dietitian when needed.</p></div>
            </Reveal>
          </div>
        </section>

        {/* APPROACH */}
        <section>
          <div className="wrap">
            <Reveal className="section-head" style={{ marginBottom: 64 }}>
              <span className="eyebrow">Wellness That Feels Personal</span>
              <h2>Nutrition, built the way you actually live.</h2>
            </Reveal>

            <Reveal className="approach-row">
              <div className="photo ph-rose grain" />
              <div>
                <h3>Personalized nutrition plans</h3>
                <p>We build your plan around your lifestyle, your goals, and your kitchen — not a generic template. It&apos;s meant to feel natural, flexible, and easy to actually follow.</p>
                <div className="approach-tags"><span>Personalized</span><span>Flexible</span></div>
              </div>
            </Reveal>

            <Reveal className="approach-row rev">
              <div className="photo ph-teal grain" />
              <div>
                <h3>A judgement-free space</h3>
                <p>Ask anything, share what&apos;s really going on with your eating, and get guidance that helps you grow — without pressure or shame.</p>
                <div className="approach-tags"><span>Confidential</span><span>Supportive</span></div>
              </div>
            </Reveal>

            <Reveal className="approach-row">
              <div className="photo ph-olive grain" />
              <div>
                <h3>Guidance from real dietitians</h3>
                <p>Dietitian-reviewed plans and, when needed, direct access to a professional — so condition-specific cases always get the right eyes on them.</p>
                <div className="approach-tags"><span>Dietitian-reviewed</span><span>Trustworthy</span></div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* DIETITIAN */}
        <section id="dietitian" style={{ background: "var(--paper)" }}>
          <div className="wrap">
            <Reveal className="dietitian">
              <div className="photo ph-terra grain" />
              <div>
                <span className="eyebrow">Founder &amp; Lead Dietitian</span>
                <p className="dietitian-quote serif">&quot;Nutrition guidance should feel like it was written for your kitchen — not translated from someone else&apos;s.&quot;</p>
                <span className="role">Dr. Astha Jadeja</span>
                <p className="bio">Dr. Astha Jadeja leads the nutrition philosophy behind Health365 — practical, judgement-free guidance built for real Indian kitchens and real routines.</p>
                <p className="note">Qualifications &amp; credentials placeholder — connect Dr. Astha&apos;s verified details here before launch.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* JOIN */}
        <section>
          <div className="wrap">
            <Reveal className="join">
              <h2>Join Health365 as a Dietitian</h2>
              <Link href="/join-as-dietitian" className="btn btn-dark">Join as a Dietitian</Link>
            </Reveal>
          </div>
        </section>

        {/* FINAL CTA */}
        <div className="final-cta">
          <div className="wrap">
            <Reveal className="final-frame ph-olive grain">
              <div className="inner">
                <h2 className="serif">365 days. One healthier you.</h2>
                <p>Start with one conversation. The rest is built around you.</p>
                <Link href="/consultation" className="btn btn-terracotta">Start Free Consultation</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
