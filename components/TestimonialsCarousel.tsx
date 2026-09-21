"use client";

import { useEffect, useRef, useState } from "react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating?: number;
}

const SLIDE_MS = 3500;

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating || 0)));
  if (value === 0) return null;
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 2 }} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: ".78rem", color: i < value ? "#E8A33D" : "var(--line)" }}>★</span>
      ))}
    </div>
  );
}

export default function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
    setActive(i);
  }

  // Auto-advances on its own, like a slideshow — loops back to the start
  // after the last card. Pauses while the visitor's cursor is over it or
  // they're dragging/swiping the track by hand.
  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setActive((i) => {
        const next = (i + 1) % testimonials.length;
        const track = trackRef.current;
        const card = track?.children[next] as HTMLElement | undefined;
        if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
        return next;
      });
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={() => (pausedRef.current = true)}
      onTouchEnd={() => (pausedRef.current = false)}
    >
      <div ref={trackRef} className="testimonial-track">
        {testimonials.map((t, i) => {
          const isSage = i % 2 === 1;
          return (
            <div
              key={t.id}
              className="testimonial-card"
              style={{ background: isSage ? "var(--sage)" : "#EFEAE0" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".7rem", fontWeight: 700, color: "var(--ink-soft)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: "1rem" }}>↗</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: ".88rem", fontWeight: 600, lineHeight: 1.3 }}>{t.name}</p>
                {t.role && <p style={{ fontSize: ".72rem", color: "var(--ink-soft)", marginTop: 2 }}>{t.role}</p>}
                <Stars rating={t.rating || 0} />
                <p style={{ fontSize: ".82rem", marginTop: 8, lineHeight: 1.5 }}>&quot;{t.quote}&quot;</p>
              </div>
            </div>
          );
        })}
      </div>

      {testimonials.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {testimonials.map((_, i) => (
            <span
              key={i}
              onClick={() => scrollToIndex(i)}
              className="carousel-dot"
              style={{ width: i === active ? 18 : 6, background: i === active ? "var(--ink)" : "var(--line)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
