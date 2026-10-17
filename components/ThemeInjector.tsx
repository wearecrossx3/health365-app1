"use client";

import { useEffect } from "react";

// Applies the admin-chosen accent/button colours. Only touches the page
// when a colour actually differs, so nothing repaints or "blinks" on load.
export default function ThemeInjector() {
  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => {
        const root = document.documentElement;
        const cs = getComputedStyle(root);
        const set = (name: string, val?: string) => {
          if (!val) return;
          if (cs.getPropertyValue(name).trim().toLowerCase() === val.trim().toLowerCase()) return;
          root.style.setProperty(name, val);
        };
        set("--sage", d.themeAccentColor);
        set("--ink", d.themeButtonColor);
      })
      .catch(() => {});
  }, []);

  return null;
}
