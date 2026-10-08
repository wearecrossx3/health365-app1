"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

// Metricool web analytics (thehealth365.in brand).
const HASH = "9f0af82cb272e5d5c3ba785f62d79793";
// Private areas — don't count these as website visits.
const PRIVATE = ["/admin", "/dashboard", "/dietitian-dashboard", "/api"];

declare global {
  interface Window { beTracker?: { t: (o: { hash: string }) => void } }
}

export default function MetricoolTracker() {
  const pathname = usePathname() || "/";
  const isPrivate = PRIVATE.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const first = useRef(true);

  // Next.js changes pages without a full reload, so log each new page.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!isPrivate && window.beTracker) window.beTracker.t({ hash: HASH });
  }, [pathname, isPrivate]);

  if (isPrivate) return null;
  return (
    <Script
      id="metricool-tracker"
      src="https://tracker.metricool.com/resources/be.js"
      strategy="afterInteractive"
      onLoad={() => window.beTracker?.t({ hash: HASH })}
    />
  );
}
