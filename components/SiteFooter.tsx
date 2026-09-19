"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import NewsletterPanel from "./NewsletterPanel";

export default function SiteFooter() {
  const [logoUrlDark, setLogoUrlDark] = useState("");

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => setLogoUrlDark(d.logoUrlDark || ""))
      .catch(() => {});
  }, []);

  return (
    <footer style={{ width: "100%", background: "var(--paper)", paddingTop: 20 }}>
      <div className="wrap" style={{ paddingBottom: 40 }}>
        <NewsletterPanel />
      </div>

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
          <div style={{ maxWidth: 240 }}>
            <Link href="/#top" className="logo"><Logo variant="dark" height={22} customUrl={logoUrlDark} /></Link>
            <p style={{ marginTop: 12, fontSize: ".85rem", color: "var(--ink-soft)" }}>
              Make your complicated nutrition simple.
            </p>
          </div>

          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Explore</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/#how" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>How it works</Link>
                <Link href="/conditions" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Conditions</Link>
                <Link href="/dietitians" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Dietitians</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Support</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/contact" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Contact</Link>
                <Link href="/join-as-dietitian" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Join as a Dietitian</Link>
                <Link href="/#about" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>About</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Legal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/privacy" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Privacy Policy</Link>
                <Link href="/terms" style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>© 2026 Health365. General nutrition guidance, not a medical diagnosis.</span>
          <span style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Made with care in Gujarat.</span>
        </div>
      </div>
    </footer>
  );
}
