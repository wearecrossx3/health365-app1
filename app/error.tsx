"use client";

import { useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 560, paddingTop: 100, paddingBottom: 120, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.8rem" }}>Something went wrong.</h1>
          <p style={{ marginTop: 12, color: "var(--ink-soft)" }}>
            That&apos;s on us, not you — please try again, or head back to the homepage.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={reset} className="btn btn-terracotta">Try again</button>
            <Link href="/" className="btn btn-outline">Back to Health365</Link>
          </div>
        </div>
      </main>
    </>
  );
}
