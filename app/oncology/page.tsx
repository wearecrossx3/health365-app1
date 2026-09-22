import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OncologyBanner from "@/components/OncologyBanner";
import { getSiteContent } from "@/lib/kv";

export default async function OncologyPage() {
  const content = await getSiteContent();

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ paddingTop: 48 }}>
          <OncologyBanner
            imageUrl={content.oncologyImageUrl}
            title={content.oncologyTitle}
            subtitle={content.oncologySubtitle}
            buttonText={content.oncologyButtonText}
            buttonHref="/consultation?condition=Oncology"
          />
        </div>

        <div className="wrap" style={{ paddingTop: 56, paddingBottom: 90 }}>
          <div className="grid-3">
            <div className="panel">
              <span style={{ fontSize: "1.6rem" }}>🍽️</span>
              <h3 style={{ fontSize: "1.05rem", marginTop: 14 }}>Appetite &amp; energy</h3>
              <p style={{ marginTop: 8, fontSize: ".88rem", color: "var(--ink-soft)" }}>Practical ways to eat enough even when treatment affects appetite, taste, or energy.</p>
            </div>
            <div className="panel">
              <span style={{ fontSize: "1.6rem" }}>🩺</span>
              <h3 style={{ fontSize: "1.05rem", marginTop: 14 }}>Treatment-aware</h3>
              <p style={{ marginTop: 8, fontSize: ".88rem", color: "var(--ink-soft)" }}>Guidance that works alongside your treatment schedule, not against it.</p>
            </div>
            <div className="panel">
              <span style={{ fontSize: "1.6rem" }}>🤝</span>
              <h3 style={{ fontSize: "1.05rem", marginTop: 14 }}>Judgement-free support</h3>
              <p style={{ marginTop: 8, fontSize: ".88rem", color: "var(--ink-soft)" }}>A dietitian who listens first — no generic charts, no pressure.</p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
