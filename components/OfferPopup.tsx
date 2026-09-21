"use client";

import { useEffect, useState, useRef } from "react";

interface PopupConfig {
  enabled: boolean;
  headline: string;
  message: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trigger: "scroll" | "time";
  triggerValue: number;
}

const DISMISS_KEY = "h365_popup_dismissed";

export default function OfferPopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (!visible || !config?.enabled || !config.message) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,24,18,.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", background: "#fff", borderRadius: 24, overflow: "hidden",
          maxWidth: config.imageUrl ? 760 : 420, width: "100%",
          display: "flex", boxShadow: "0 40px 80px -20px rgba(0,0,0,.4)",
          animation: "modalPopIn .35s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 2, width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,.9)", border: "none", fontSize: "1.1rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ×
        </button>

        {config.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.imageUrl} alt="" style={{ width: "42%", objectFit: "cover", flex: "none" }} />
        )}

        <div style={{ padding: "40px 36px", flex: 1 }}>
          {config.headline && (
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>{config.headline}</h2>
          )}
          <p style={{ fontSize: ".92rem", color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6 }}>{config.message}</p>

          {status === "done" ? (
            <p style={{ marginTop: 20, color: "var(--teal-deep)", fontWeight: 600, fontSize: ".92rem" }}>✓ You&apos;re in — thank you!</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{ width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".92rem" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="pill pill-primary"
                style={{ width: "100%", textAlign: "center", marginTop: 12, padding: "13px 20px" }}
              >
                {status === "loading" ? "…" : config.ctaText || "Unlock Offer"}
              </button>
              {status === "error" && <p style={{ color: "var(--terracotta)", fontSize: ".78rem", marginTop: 8 }}>Something went wrong — please try again.</p>}
            </form>
          )}

          <button
            onClick={dismiss}
            style={{ display: "block", marginTop: 16, background: "none", border: "none", color: "var(--ink-soft)", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            No, thanks
          </button>
        </div>
      </div>
    </div>
  );
}
