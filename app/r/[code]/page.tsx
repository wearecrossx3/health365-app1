import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { codeOwnerName, cleanCode } from "@/lib/referral";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "You're invited to Health365", robots: { index: false, follow: false } };

const PLAY = "https://play.google.com/store/apps/details?id=com.frontpagestudios.health365";

// Landing page for an invite link: https://www.thehealth365.in/r/CODE
export default async function InvitePage({ params }: { params: { code: string } }) {
  const code = cleanCode(params.code);
  const who = await codeOwnerName(code).catch(() => null);
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 560, paddingTop: 64, paddingBottom: 96, textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🎁</div>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", marginTop: 8 }}>{who ? `${who} invited you to Health365` : "You're invited to Health365"}</h1>
          <p style={{ marginTop: 14, color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.7 }}>
            Personalised Indian diet plans, water and weight tracking, and real dietitians. Join with the invite code below and you both get a <b>free 7-day plan</b>.
          </p>
          {who && (
            <div style={{ margin: "26px auto 0", display: "inline-block", padding: "14px 26px", borderRadius: 16, border: "2px dashed var(--teal)", fontSize: "1.6rem", fontWeight: 700, letterSpacing: 3 }}>{code}</div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
            <a href={PLAY} className="pill pill-primary">Get the app</a>
            <a href={`/signup?ref=${code}`} className="pill pill-outline">Sign up on the website</a>
          </div>
          <p style={{ marginTop: 18, fontSize: ".85rem", color: "var(--ink-soft)" }}>In the app, type the code on the &quot;Save your plan&quot; screen.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
