"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthModal } from "./AuthModalProvider";

export default function SiteHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
      </div>
    </header>
  );
}
