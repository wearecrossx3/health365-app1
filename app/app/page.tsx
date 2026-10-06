import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import "./app-landing.css";

// Flip PLAY_LIVE to true on launch day — the Google Play button then
// links straight to the store listing instead of showing "Coming soon".
const PLAY_LIVE = false;
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.frontpagestudios.health365";

export const metadata: Metadata = {
  title: "Health365 app — Indian diet plans, built for your kitchen",
  description:
    "Personalised 7-day Indian meal plans for weight, PCOS, diabetes, thyroid and more — with meal and water tracking, reminders and a real dietitian. Coming soon on Google Play.",
  alternates: { canonical: "/app" },
  openGraph: {
    title: "Health365 app — Indian diet plans, built for your kitchen",
    description: "Personalised 7-day Indian meal plans with tracking, reminders and a real dietitian.",
    url: "/app",
    images: ["/app-landing/home.webp"],
  },
};

const S = "/app-landing/";

function Phone({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <div className={`al-phone ${className}`}>
      <span className="al-cam" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={S + src} alt={alt} width={390} height={844} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

function PlayButton({ big = false }: { big?: boolean }) {
  const inner = (
    <>
      <svg viewBox="0 0 24 24" aria-hidden className="al-play-ic">
        <path fill="#34A853" d="M3.6 1.8 13.3 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-.9.6-1.2z" />
        <path fill="#FBBC04" d="m16.6 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.8 2.2z" />
        <path fill="#4285F4" d="M16.6 15.3 13.3 12 3.6 22.2c.4.2.9.2 1.4-.1l11.6-6.8z" />
        <path fill="#EA4335" d="M16.6 8.7 5 1.9c-.5-.3-1-.3-1.4-.1L13.3 12l3.3-3.3z" />
      </svg>
      <span>
        <small>{PLAY_LIVE ? "Get it on" : "Coming soon on"}</small>
        <b>Google Play</b>
      </span>
    </>
  );
  return PLAY_LIVE ? (
    <a href={PLAY_URL} className={`al-play${big ? " big" : ""}`} target="_blank" rel="noopener">{inner}</a>
  ) : (
    <span className={`al-play soon${big ? " big" : ""}`} aria-label="Coming soon on Google Play">{inner}</span>
  );
}

const Check = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="al-check"><circle cx="10" cy="10" r="10" /><path d="m6 10.2 2.6 2.6L14.2 7" /></svg>
);

const goals = [
  { k: "lose", c: "orange", t: "Lose Weight", d: "A steady, sustainable plan — not a crash diet." },
  { k: "gain", c: "lime", t: "Gain Weight", d: "Build up healthily with a plan that fits your routine." },
  { k: "better", c: "green", t: "Eat Better", d: "Small, everyday changes that make eating well feel natural." },
  { k: "cond", c: "lav", t: "Manage a Condition", d: "Condition-specific guidance, reviewed by a real dietitian." },
];
const conds = [
  ["diabetes", "Diabetes"], ["pcos", "PCOS"], ["thyroid", "Thyroid"], ["weight", "Weight Management"],
  ["cholesterol", "Cholesterol"], ["digestive", "Digestive Health"], ["cancer", "Cancer Care"],
];

const features = [
  {
    verb: "Plan", tone: "teal", img: "plan.webp", alt: "Health365 7-day diet plan screen",
    h: "A 7-day plan, built for your kitchen.",
    p: "Tell Health365 your goal, body and routine, and get a week of Indian meals with daily calorie, protein and water targets — vegetarian, Jain, eggetarian, non-veg or vegan, minus the foods you avoid.",
    b: ["Swap any meal you don't fancy", "Download your plan as a PDF", "Calories, protein, carbs and fat for every day"],
  },
  {
    verb: "Track", tone: "lime", img: "home.webp", alt: "Health365 home dashboard with today's target and water",
    h: "Tick meals. Count glasses. Watch the day add up.",
    p: "Your dashboard shows what's up next, how many meals you've had and how much water you've had — always against today's target.",
    b: ["Meal-by-meal progress ring", "Water goal, one glass at a time", "Weekly weigh-in to see the trend"],
  },
  {
    verb: "Remind", tone: "orange", img: "reminders.webp", alt: "Health365 reminders settings screen",
    h: "Reminders that know your plan.",
    p: "At meal times Health365 tells you what's on your plate — plus water breaks and a weekly weigh-in. Reminders are set on your phone and work without internet.",
    b: ["Meal times, with the meal from your plan", "Water breaks through the day", "Switch any reminder off in Profile"],
    notif: true,
  },
  {
    verb: "Consult", tone: "lav", img: "dietitian.webp", alt: "Dietitian profile for Dt. Astha Jadeja",
    h: "A real dietitian, when you need one.",
    p: "Book a 1:1 consultation for a plan built around your reports, routine and kitchen — with follow-ups.",
    b: ["Dt. Astha Jadeja, Founder & Lead Dietitian", "Speaks English, Hindi and Gujarati", "Diabetes, PCOS and weight management"],
  },
];

const steps = [
  { n: "1", h: "Pick a goal", p: "Lose, gain, eat better or manage a condition.", img: "goal.webp", alt: "Choose your goal screen" },
  { n: "2", h: "Tell us your kitchen", p: "Veg, Jain, egg, non-veg or vegan — and what you avoid.", img: "kitchen.webp", alt: "Food preference screen" },
  { n: "3", h: "Get your plan", p: "Your daily targets and a full week of meals, ready to follow.", img: "ready.webp", alt: "Your plan is ready screen" },
];

const faqs = [
  ["Is Health365 free?", "You can start free — your first day's plan costs nothing. The full 7-day plan and 1:1 dietitian consultations are paid, and you'll always see the price before you pay (UPI accepted)."],
  ["Which diets does it support?", "Vegetarian, Jain, eggetarian, non-vegetarian and vegan. You can also list foods you avoid — nuts, dairy, gluten, soy and more — and the plan works around them."],
  ["I have PCOS, diabetes or thyroid. Is it for me?", "Yes — choose “Manage a Condition” and pick what applies. Plans are condition-focused and reviewed by a real dietitian. It's general nutrition guidance, not a diagnosis, so keep your doctor in the loop, especially if you take medication."],
  ["Do I need internet for reminders?", "No. Meal, water and weigh-in reminders are set on your phone and work offline. You can change or turn them off anytime in Profile → Reminders."],
  ["Is there an iPhone app?", "The Android app is coming to Google Play. On iPhone or a computer, you can get your plan on the web today."],
  ["Can I delete my data?", "Yes. You can delete your account and data anytime from the app or our delete-account page."],
];

export default function AppLandingPage() {
  return (
    <div className="al">
      <SiteHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="al-hero">
        <div className="al-wrap al-hero-grid">
          <div className="al-hero-copy">
            <span className="al-badge"><i />Coming soon on Google Play</span>
            <h1>Your diet plan, built for <em>your kitchen.</em></h1>
            <p className="al-lead">
              Personalised 7-day Indian meal plans for weight, PCOS, diabetes, thyroid and more — with meal and water
              tracking, gentle reminders and a real dietitian a tap away.
            </p>
            <div className="al-ctas">
              <PlayButton />
              <Link href="/diet-plan" className="al-btn al-btn-ghost">Get my plan on the web <span aria-hidden>→</span></Link>
            </div>
            <ul className="al-mini">
              <li><Check />First day free</li>
              <li><Check />Veg, Jain, egg &amp; non-veg</li>
              <li><Check />Works with your routine</li>
            </ul>
          </div>

          <div className="al-hero-art" aria-hidden={false}>
            <div className="al-blob al-blob-a" />
            <div className="al-blob al-blob-b" />
            <Phone src="plan.webp" alt="7-day diet plan in the Health365 app" className="back" eager />
            <Phone src="home.webp" alt="Health365 home dashboard" className="front" eager />
            <div className="al-float al-notif">
              <span className="al-notif-ic"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" /></svg></span>
              <span><b>Lunch time</b><small>2 rotis + soya chunk sabzi + dal + salad</small></span>
            </div>
            <div className="al-float al-kcal"><b>1,500</b> kcal / day</div>
          </div>
        </div>
      </section>

      {/* ---------------- TRUST STRIP ---------------- */}
      <section className="al-trust">
        <div className="al-wrap al-trust-row">
          <div><b>Reviewed by a dietitian</b><span>Plans shaped by Dt. Astha Jadeja</span></div>
          <div><b>5 ways to eat</b><span>Veg · Jain · Egg · Non-veg · Vegan</span></div>
          <div><b>Offline reminders</b><span>Meals, water and weigh-ins</span></div>
          <div><b>Made in Gujarat</b><span>For every Indian kitchen</span></div>
        </div>
      </section>

      {/* ---------------- GOALS ---------------- */}
      <section className="al-sec al-goals" id="goals">
        <div className="al-wrap">
          <Reveal className="al-head">
            <span className="al-eyebrow">Start where you are</span>
            <h2>What brings you here?</h2>
            <p>Pick a starting point — your plan adapts around it.</p>
          </Reveal>
          <div className="al-goal-grid">
            {goals.map((g, i) => (
              <Reveal key={g.k} delay={i * 70} className="al-goal">
                <span className={`al-gicon ${g.c}`}><i className={g.k} /></span>
                <h3>{g.t}</h3>
                <p>{g.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="al-conds">
            <p className="al-conds-t">Condition-focused plans for</p>
            <div className="al-cond-row">
              {conds.map(([k, n]) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={`${S}c-${k}.webp`} alt={n} width={112} height={143} loading="lazy" />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="al-sec al-features" id="features">
        <div className="al-wrap">
          {features.map((f, i) => (
            <div key={f.verb} className={`al-feat${i % 2 ? " flip" : ""}`}>
              <Reveal className="al-feat-copy">
                <span className={`al-verb ${f.tone}`}>{f.verb}</span>
                <h2>{f.h}</h2>
                <p>{f.p}</p>
                <ul>{f.b.map((x) => <li key={x}><Check />{x}</li>)}</ul>
              </Reveal>
              <Reveal delay={120} className={`al-feat-art ${f.tone}`}>
                <Phone src={f.img} alt={f.alt} />
                {f.notif && (
                  <div className="al-float al-notif al-notif-feat">
                    <span className="al-notif-ic"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" /></svg></span>
                    <span><b>Water break</b><small>Glass 5 of 9 — keep going</small></span>
                  </div>
                )}
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="al-sec al-steps" id="how-app">
        <div className="al-wrap">
          <Reveal className="al-head">
            <span className="al-eyebrow">How it works</span>
            <h2>Your plan in three steps</h2>
          </Reveal>
          <div className="al-step-grid">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110} className="al-step">
                <div className="al-step-art"><Phone src={s.img} alt={s.alt} className="sm" /></div>
                <span className="al-step-n">{s.n}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- EXPERT ---------------- */}
      <section className="al-expert">
        <div className="al-wrap al-expert-in">
          <Reveal>
            <span className="al-eyebrow light">From our founder</span>
            <blockquote>
              &ldquo;Nutrition guidance should feel like it was written for your kitchen — not translated from someone
              else&rsquo;s.&rdquo;
            </blockquote>
            <div className="al-sign">
              <span className="al-av">AJ</span>
              <span><b>Dt. Astha Jadeja</b><small>Founder &amp; Lead Dietitian, Health365</small></span>
              <Link href="/dietitians" className="al-link-light">Meet our dietitians →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="al-sec al-faq" id="faq">
        <div className="al-wrap al-faq-grid">
          <Reveal className="al-head left">
            <span className="al-eyebrow">FAQ</span>
            <h2>Questions, answered</h2>
            <p>Can&rsquo;t find what you need? <Link href="/contact">Talk to our care team</Link>.</p>
          </Reveal>
          <div className="al-faq-list">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<span aria-hidden /></summary>
                <p>
                  {a}
                  {q.startsWith("Can I delete") && <> <Link href="/delete-account">Delete account →</Link></>}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="al-final">
        <div className="al-wrap">
          <div className="al-final-card">
            <div className="al-final-copy">
              <h2>Your health, <em>your 365.</em></h2>
              <p>Health365 is coming soon to Google Play. Start your plan on the web today.</p>
              <div className="al-ctas">
                <PlayButton big />
                <Link href="/diet-plan" className="al-btn al-btn-light">Get my plan on the web <span aria-hidden>→</span></Link>
              </div>
            </div>
            <div className="al-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${S}qr.svg`} alt="QR code to open thehealth365.in/app" width={150} height={150} />
              <span>Scan to open on your phone</span>
            </div>
            <Phone src="consult.webp" alt="Consult tab in the Health365 app" className="final" eager />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
