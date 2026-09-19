"use client";

import { useEffect, useState } from "react";

const SLIDE_MS = 5000;

export default function HeroCarousel({ images }: { images: string[] }) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="ph-teal grain" style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
      {slides.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center",
            opacity: i === index ? 1 : 0,
            transition: "opacity 1.2s ease",
          }}
        />
      ))}
    </div>
  );
}
