"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties, ElementType } from "react";

export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as ElementType;

  return (
    <Component
      ref={ref}
      className={`${visible ? "reveal-in" : "reveal-init"}${className ? " " + className : ""}`}
      style={{ animationDelay: visible ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </Component>
  );
}
