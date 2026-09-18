"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  const [logoUrlDark, setLogoUrlDark] = useState("");

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => setLogoUrlDark(d.logoUrlDark || ""))
      .catch(() => {});
  }, []);

  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <Link href="/#top" className="logo"><Logo variant="dark" height={24} customUrl={logoUrlDark} /></Link>
          <div className="footer-links">
            <Link href="/#how">How it works</Link>
            <Link href="/conditions">Conditions</Link>
            <Link href="/dietitians">Dietitians</Link>
            <Link href="/#about">About</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Health365. General nutrition guidance, not a medical diagnosis.</span>
          <span>Made with care in Gujarat.</span>
        </div>
      </div>
    </footer>
  );
}
