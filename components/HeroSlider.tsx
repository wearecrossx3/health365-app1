"use client";

import { useEffect, useState } from "react";

const SLIDE_MS = 6000;

export default function HeroSlider({ images }: { images: string[] }) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {slides.map((src, i) => (
        <div
          key={src + i}
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center",
            opacity: i === index ? 1 : 0,
            transition: "opacity 1.2s ease",
          }}
        />
      ))}
      {slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 18, right: 24, zIndex: 2, display: "flex", gap: 6 }}>
          {slides.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === index ? 18 : 6, height: 6, borderRadius: 100,
                background: i === index ? "#fff" : "rgba(255,255,255,.5)",
                transition: "width .3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
