"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, sans-serif", background: "#FFFFFF" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.8rem", color: "#20241F", marginBottom: 12 }}>Something went wrong.</h1>
          <p style={{ color: "#666B5F", marginBottom: 24, maxWidth: "44ch" }}>
            That&apos;s on us, not you — please try again, or head back to the homepage.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                background: "#C96A3C", color: "#fff", border: "none", padding: "14px 26px",
                borderRadius: 100, fontWeight: 700, fontSize: ".88rem", cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                background: "#fff", color: "#20241F", border: "1.5px solid rgba(32,36,31,.14)",
                padding: "14px 26px", borderRadius: 100, fontWeight: 700, fontSize: ".88rem", textDecoration: "none",
              }}
            >
              Back to Health365
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
