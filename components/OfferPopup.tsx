"use client";

import { useEffect, useState, useRef } from "react";

interface PopupConfig {
  enabled: boolean;
  message: string;
  ctaText: string;
  ctaLink: string;
  trigger: "scroll" | "time";
  triggerValue: number;
}

const DISMISS_KEY = "h365_popup_dismissed";

export default function OfferPopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => setConfig(d.popup || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!config?.enabled || !config.message) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    if (config.trigger === "time") {
      const seconds = Math.max(1, config.triggerValue || 3);
      const t = setTimeout(() => {
        if (!shownRef.current) {
          shownRef.current = true;
          setVisible(true);
        }
      }, seconds * 1000);
      return () => clearTimeout(t);
    }

    const pct = Math.min(90, Math.max(5, config.triggerValue || 30));
    function onScroll() {
      if (shownRef.current) return;
      const doc = document.documentElement;
      const scrolledPct = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
      if (scrolledPct >= pct) {
        shownRef.current = true;
        setVisible(true);
      }
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, [config]);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (!visible || !config?.enabled || !config.message) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 24, left: 24, zIndex: 90, maxWidth: 340,
        background: "#fff", borderRadius: 20, padding: 22,
        boxShadow: "0 24px 50px -18px rgba(20,24,18,.35)", border: "1px solid var(--line)",
        animation: "modalPopIn .35s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute", top: 10, right: 10, background: "none", border: "none",
          fontSize: "1.1rem", color: "var(--ink-soft)", cursor: "pointer", lineHeight: 1,
        }}
      >
        ×
      </button>
      <p style={{ fontSize: ".92rem", color: "var(--ink)", lineHeight: 1.5, marginRight: 14 }}>{config.message}</p>
      <a
        href={config.ctaLink || "/consultation"}
        onClick={dismiss}
        className="pill pill-primary"
        style={{ display: "inline-block", marginTop: 14, padding: "10px 20px", fontSize: ".82rem" }}
      >
        {config.ctaText || "Start Free Consultation"}
      </a>
    </div>
  );
}
