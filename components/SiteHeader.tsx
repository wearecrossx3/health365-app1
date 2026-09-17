"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthModal } from "./AuthModalProvider";

export default function SiteHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useAuthModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  function handleBookConsultation() {
    setMenuOpen(false);
    if (loggedIn) router.push("/consultation");
    else open("signup");
  }

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/#top" className="logo">Health365</Link>

        <nav className="nav-links">
          <Link href="/#how">How it works</Link>
          <Link href="/conditions">Conditions</Link>
          <Link href="/dietitians">Dietitians</Link>
          <Link href="/#about">About</Link>
        </nav>

        <div className="nav-actions-desktop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {loggedIn === true && (
            <Link href="/dashboard" style={{ fontSize: ".86rem", fontWeight: 600 }}>Dashboard</Link>
          )}
          {loggedIn === false && (
            <button onClick={() => open("login")} style={{ fontSize: ".86rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>
              Log in
            </button>
          )}
          <button onClick={handleBookConsultation} className="btn btn-terracotta">Book a Consultation</button>
        </div>

        <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <span style={{ transform: menuOpen ? "translateY(3.5px) rotate(45deg)" : "none", transition: "transform .2s ease" }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transition: "opacity .2s ease" }} />
          <span style={{ transform: menuOpen ? "translateY(-3.5px) rotate(-45deg)" : "none", transition: "transform .2s ease" }} />
        </button>
      </div>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/#how" onClick={() => setMenuOpen(false)}>How it works</Link>
        <Link href="/conditions" onClick={() => setMenuOpen(false)}>Conditions</Link>
        <Link href="/dietitians" onClick={() => setMenuOpen(false)}>Dietitians</Link>
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
