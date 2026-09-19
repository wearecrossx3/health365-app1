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
    <footer style={{ padding: "36px 0" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <Link href="/#top" className="logo"><Logo variant="dark" height={22} customUrl={logoUrlDark} /></Link>
        <span style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>
          © 2026 Health365. Thoughtful nutrition for every kitchen.
        </span>
        <div style={{ display: "flex", gap: 22 }}>
          <Link href="/conditions" style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Conditions</Link>
          <Link href="/dietitians" style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Dietitians</Link>
          <Link href="/contact" style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Contact</Link>
        </div>
      </div>
    </footer>
  );
}
