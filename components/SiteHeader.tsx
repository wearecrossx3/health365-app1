"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthModal } from "./AuthModalProvider";
import Logo from "./Logo";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrlLight, setLogoUrlLight] = useState("");
  const [logoUrlDark, setLogoUrlDark] = useState("");
  const [oncologyEnabled, setOncologyEnabled] = useState(false);
  const { open } = useAuthModal();

  // Only the homepage has a photo hero sitting directly behind the
  // transparent nav — every other page is plain background from the
  // top, so only the homepage (and only before scrolling) needs
  // white logo/text for contrast against the photo.
  const onDarkHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => {
        setLogoUrlLight(d.logoUrlLight || "");
        setLogoUrlDark(d.logoUrlDark || "");
        setOncologyEnabled(!!d.oncologyEnabled);
      })
      .catch(() => {});
  }, []);

  function handleBookConsultation() {
    setMenuOpen(false);
    if (loggedIn) router.push("/consultation");
    else open("signup");
  }

  const linkColor = onDarkHero ? "#fff" : "var(--ink)";

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}${onDarkHero ? " on-dark" : ""}`}>
      <div className="nav-inner">
        <Link href="/#top" className="logo"><Logo variant={onDarkHero ? "light" : "dark"} height={24} customUrl={onDarkHero ? logoUrlLight : logoUrlDark} /></Link>

        <nav className="nav-links" style={{ color: linkColor }}>
          <Link href="/#how" style={{ color: linkColor }}>How it works</Link>
          <Link href="/conditions" style={{ color: linkColor }}>Conditions</Link>
          <Link href="/dietitians" style={{ color: linkColor }}>Dietitians</Link>
          {oncologyEnabled && <Link href="/oncology" style={{ color: linkColor }}>Cancer Care</Link>}
          <Link href="/#about" style={{ color: linkColor }}>About</Link>
        </nav>

        <div className="nav-actions-desktop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {loggedIn === true && (
            <Link href="/dashboard" style={{ fontSize: ".86rem", fontWeight: 600, color: linkColor }}>Dashboard</Link>
          )}
          {loggedIn === false && (
            <button onClick={() => open("login")} style={{ fontSize: ".86rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: linkColor }}>
              Log in
            </button>
          )}
          <button onClick={handleBookConsultation} className="btn btn-terracotta">Book a Consultation</button>
        </div>

        <button className={`nav-toggle${onDarkHero ? " on-dark" : ""}`} aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <span style={{ transform: menuOpen ? "translateY(3.5px) rotate(45deg)" : "none", transition: "transform .2s ease" }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transition: "opacity .2s ease" }} />
          <span style={{ transform: menuOpen ? "translateY(-3.5px) rotate(-45deg)" : "none", transition: "transform .2s ease" }} />
        </button>
      </div>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/#how" onClick={() => setMenuOpen(false)}>How it works</Link>
        <Link href="/conditions" onClick={() => setMenuOpen(false)}>Conditions</Link>
        <Link href="/dietitians" onClick={() => setMenuOpen(false)}>Dietitians</Link>
        {oncologyEnabled && <Link href="/oncology" onClick={() => setMenuOpen(false)}>Cancer Care</Link>}
        <Link href="/#about" onClick={() => setMenuOpen(false)}>About</Link>
        {loggedIn === true && <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
        {loggedIn === false && (
          <button onClick={() => { setMenuOpen(false); open("login"); }}>Log in</button>
        )}
        <button onClick={handleBookConsultation} style={{ color: "var(--terracotta)" }}>Book a Consultation</button>
      </div>
    </header>
  );
}
