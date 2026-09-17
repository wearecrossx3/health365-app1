"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/#top" className="logo">Health365</Link>
        <nav className="nav-links">
          <Link href="/#how">How it works</Link>
          <Link href="/#conditions">Conditions</Link>
          <Link href="/#dietitian">Dietitians</Link>
          <Link href="/#about">About</Link>
        </nav>
        <Link href="/consultation" className="btn btn-terracotta">Book a Consultation</Link>
      </div>
    </header>
  );
}
