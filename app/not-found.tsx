import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 640, paddingTop: 100, paddingBottom: 120, textAlign: "center" }}>
          <span className="eyebrow">404</span>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>This page wandered off its meal plan.</h1>
          <p style={{ marginTop: 16, fontSize: "1.02rem", color: "var(--ink-soft)" }}>
            The page you&apos;re looking for doesn&apos;t exist, or may have moved.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-terracotta">Back to Health365</Link>
            <Link href="/contact" className="btn btn-outline">Contact us</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
