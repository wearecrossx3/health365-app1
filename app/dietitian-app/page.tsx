import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DIETITIAN_APP } from "@/lib/appDownloads";

export const metadata: Metadata = {
  title: "Health365 Dietitian app",
  description: "The app for Health365 dietitians — chat with your clients and send diet plans.",
  robots: { index: false },
};

export default function DietitianAppPage() {
  const steps = [
    ["Download", "Tap “Download for Android” on your Android phone."],
    ["Open the file", "When the download finishes, tap it. If Android asks, allow “Install unknown apps” for your browser — this app comes straight from Health365, not the Play Store."],
    ["Install", "Tap Install, then Open."],
    ["Log in", "Use the same email and password as your Health365 account. Joined with Google? Set a password first with “Forgot password”."],
  ];
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--paper)" }}>
        <div className="wrap" style={{ maxWidth: 620, paddingTop: 48, paddingBottom: 90, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/downloads/dietitian-icon.png" alt="" width={96} height={96} style={{ margin: "0 auto", borderRadius: 24 }} />
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", marginTop: 18 }}>Health365 Dietitian app</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.6 }}>
            Chat with your clients, see their reports and send diet plans — all in one place. Client phone numbers and emails stay private.
          </p>
          <a href={DIETITIAN_APP.url} download className="pill pill-primary" style={{ display: "inline-block", marginTop: 22, padding: "14px 26px", fontSize: "1rem" }}>
            ⬇️ Download for Android
          </a>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginTop: 8 }}>Version {DIETITIAN_APP.version} · free · for approved Health365 dietitians</p>

          <div className="step-card" style={{ textAlign: "left", marginTop: 30 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>How to install</h2>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.55, fontSize: ".95rem" }}>
              {steps.map(([t, d]) => <li key={t}><b>{t}.</b> {d}</li>)}
            </ol>
          </div>
          <p style={{ fontSize: ".9rem", color: "var(--ink-soft)", marginTop: 22 }}>
            On a computer? Use it in your browser: <Link href="/admin/login" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>thehealth365.in/admin</Link>
          </p>

          <div className="step-card" style={{ textAlign: "left", marginTop: 18 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>On iPhone</h2>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.55, fontSize: ".95rem" }}>
              <li>Open <Link href="/admin/login" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>thehealth365.in/admin</Link> in <b>Safari</b> and log in.</li>
              <li>Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</li>
              <li>Open <b>H365 Dietitian</b> from your home screen. It opens full screen, just like the Android app.</li>
            </ol>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
