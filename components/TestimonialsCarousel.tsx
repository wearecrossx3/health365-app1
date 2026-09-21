"use client";

import { useRef, useState } from "react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export default function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
    setActive(i);
  }

  function shift(dir: number) {
    scrollToIndex(Math.max(0, Math.min(testimonials.length - 1, active + dir)));
  }

  // Keeps the dots/arrows in sync when the visitor drags/swipes the
  // track directly instead of using the buttons.
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    let closest = 0;
    let minDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft - track.offsetLeft - track.scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }

  if (testimonials.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <div ref={trackRef} onScroll={handleScroll} className="testimonial-track">
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
                <p style={{ fontSize: ".82rem", marginTop: 8, lineHeight: 1.5 }}>&quot;{t.quote}&quot;</p>
              </div>
            </div>
          );
        })}
      </div>

      {testimonials.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 22 }}>
          <button type="button" onClick={() => shift(-1)} disabled={active === 0} aria-label="Previous testimonial" className="carousel-arrow">
            ←
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {testimonials.map((_, i) => (
              <span
                key={i}
                onClick={() => scrollToIndex(i)}
                className="carousel-dot"
                style={{ width: i === active ? 18 : 6, background: i === active ? "var(--ink)" : "var(--line)" }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={active === testimonials.length - 1}
            aria-label="Next testimonial"
            className="carousel-arrow"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
