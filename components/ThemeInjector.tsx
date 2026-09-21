"use client";

import { useEffect } from "react";

export default function ThemeInjector() {
  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => {
        const root = document.documentElement;
        if (d.themeAccentColor) root.style.setProperty("--sage", d.themeAccentColor);
        if (d.themeButtonColor) root.style.setProperty("--ink", d.themeButtonColor);
      })
      .catch(() => {});
  }, []);

  return null;
}
