"use client";

import { useEffect } from "react";

// Links pasted into WhatsApp or SMS often pick up the next character, like
// "thehealth365.in/dietitian-app)" or "…/m." — send those to the real page.
export default function FixPastedLink() {
  useEffect(() => {
    const p = decodeURIComponent(location.pathname);
    const clean = p.replace(/[)\].,;:!?'"’”>]+$/, "");
    if (clean && clean !== p) location.replace(clean + location.search + location.hash);
  }, []);
  return null;
}
