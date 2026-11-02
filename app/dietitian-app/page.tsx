import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PLAY_URL } from "@/lib/appLinks";
import { DIETITIAN_APP } from "@/lib/appDownloads";

export const metadata: Metadata = {
  title: "Health365 for dietitians",
  description: "Health365 dietitians work right inside the Health365 app — chat with clients and send diet plans.",
  robots: { index: false },
};

// Dietitians no longer need a separate app: they log in to the main
// Health365 app with "I'm a dietitian".
export default function DietitianAppPage() {
  const steps = [
    ["Install Health365", "Get the Health365 app from Google Play (already have it? Update it to the latest version)."],
    ["Tap “I’m a dietitian”", "It’s on the first screen of the app, under “I already have an account”."],
    ["Log in", "Use the same email and password as your Health365 account, or Continue with Google. New here? Tap “Create an account and apply”."],
    ["Start working", "Your clients, chats and diet plans open right there. Add your photo and bio in Me › Edit profile."],
  ];
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--paper)" }}>
        <div className="wrap" style={{ maxWidth: 620, paddingTop: 48, paddingBottom: 90, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={96} height={96} style={{ margin: "0 auto", borderRadius: 24 }} />
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", marginTop: 18 }}>Health365 for dietitians</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.6 }}>
            No separate app needed. Log in to the Health365 app as a dietitian to chat with your clients, see their reports and send diet plans. Client phone numbers and emails stay private.
          </p>
          <a href={PLAY_URL} className="pill pill-primary" style={{ display: "inline-block", marginTop: 22, padding: "14px 26px", fontSize: "1rem" }}>
            ▶ Get it on Google Play
          </a>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginTop: 8 }}>Free · the same app clients use</p>

          <div className="step-card" style={{ textAlign: "left", marginTop: 30 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>How to start</h2>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.55, fontSize: ".95rem" }}>
              {steps.map(([t, d]) => <li key={t}><b>{t}.</b> {d}</li>)}
            </ol>
          </div>
          <p style={{ fontSize: ".9rem", color: "var(--ink-soft)", marginTop: 22 }}>
            Read the <Link href="/dietitian-terms" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Terms for dietitians</Link>. You accept them when you apply.
          </p>

          <div className="step-card" style={{ textAlign: "left", marginTop: 18 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>On iPhone or a computer</h2>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.55, fontSize: ".95rem" }}>
              <li>Open <Link href="/admin/my-clients" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>thehealth365.in/admin/my-clients</Link> and log in.</li>
              <li>On iPhone, tap <b>Share</b> › <b>Add to Home Screen</b> to keep it like an app.</li>
            </ol>
          </div>
          <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 22 }}>
            Still using the old Dietitian app? It keeps working, but please move to the Health365 app. <a href={DIETITIAN_APP.url} download style={{ color: "var(--ink-soft)" }}>Old app (v{DIETITIAN_APP.version})</a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
