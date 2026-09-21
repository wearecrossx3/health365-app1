"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import NewsletterPanel from "./NewsletterPanel";

const ICON_STYLE = {
  width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--ink)", flexShrink: 0,
};

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 19c.5-2 1.5-6 1.5-6M12 13c2 1 4-1 4-3.5 0-2-1.5-3.5-4-3.5-2.8 0-4.5 2-4.5 4 0 1.2.5 2 1 2.4" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <line x1="7" y1="10" x2="7" y2="17" />
      <circle cx="7" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <path d="M11 17v-7M11 12c0-1.5 1.2-2.5 2.5-2.5S16 10.5 16 12v5" />
    </svg>
  );
}

export default function SiteFooter() {
  const [logoUrlDark, setLogoUrlDark] = useState("");
  const [social, setSocial] = useState({ instagramUrl: "", youtubeUrl: "", pinterestUrl: "", linkedinUrl: "" });

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => {
        setLogoUrlDark(d.logoUrlDark || "");
        setSocial({
          instagramUrl: d.instagramUrl || "",
          youtubeUrl: d.youtubeUrl || "",
          pinterestUrl: d.pinterestUrl || "",
          linkedinUrl: d.linkedinUrl || "",
        });
      })
      .catch(() => {});
  }, []);

  const socialLinks = [
    { url: social.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { url: social.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
    { url: social.pinterestUrl, label: "Pinterest", Icon: PinterestIcon },
    { url: social.linkedinUrl, label: "LinkedIn", Icon: LinkedinIcon },
  ].filter((s) => s.url);

  return (
    <footer style={{ width: "100%", background: "var(--paper)", paddingTop: 20 }}>
      <div className="wrap" style={{ paddingBottom: 40 }}>
        <NewsletterPanel />
      </div>

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div className="footer-top" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
          <div style={{ maxWidth: 240 }}>
            <Link href="/#top" className="logo"><Logo variant="dark" height={22} customUrl={logoUrlDark} /></Link>
            <p style={{ marginTop: 12, fontSize: ".85rem", color: "var(--ink-soft)" }}>
              Make your complicated nutrition simple.
            </p>
          </div>

          <div className="footer-nav-cols" style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
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
            {socialLinks.length > 0 && (
              <div>
                <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Get in touch</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {socialLinks.map(({ url, label, Icon }) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} style={ICON_STYLE}>
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}
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
