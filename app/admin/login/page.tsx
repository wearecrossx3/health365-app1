"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inApp, setInApp] = useState(true);
  useEffect(() => {
    // Google blocks sign-in inside the Admin/Dietitian apps, so the button shows only in a browser.
    setInApp(!!(window as unknown as { AdminApp?: unknown }).AdminApp);
    if (new URLSearchParams(location.search).get("google") === "noaccess") setError("That Google account doesn't have Team or Dietitian access.");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Incorrect email or password.");
      return;
    }
    const next = new URLSearchParams(location.search).get("next") || "";
    router.push(/^\/admin(\/[\w/-]*)?$/.test(next) ? next : "/admin");
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0F1613", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", marginBottom: 18 }}>
            <Logo variant="light" height={26} />
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument), sans-serif", fontWeight: 600, fontSize: "1.5rem", color: "#fff" }}>Team &amp; Dietitian login</h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".88rem", marginTop: 6 }}>Sign in with your Health365 account</p>
          <p style={{ fontSize: ".82rem", marginTop: 8 }}><a href="/dietitian-app" style={{ color: "#CBDB3D", fontWeight: 600 }}>Dietitian? Get the app →</a></p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: "#182420", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <label style={{ fontSize: ".82rem", fontWeight: 600, color: "rgba(255,255,255,.85)", display: "block", marginBottom: 8 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0F1613", color: "#fff", fontSize: ".92rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: ".82rem", fontWeight: 600, color: "rgba(255,255,255,.85)", display: "block", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0F1613", color: "#fff", fontSize: ".92rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: ".78rem", cursor: "pointer" }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span style={{ fontSize: ".82rem", color: "rgba(255,255,255,.7)" }}>Remember me</span>
            </label>
            <Link href="/forgot-password" style={{ fontSize: ".82rem", color: "var(--mint)" }}>Forgot password?</Link>
          </div>

          {error && <p style={{ color: "#FF8A70", fontSize: ".85rem" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pill pill-primary"
            style={{ textAlign: "center", padding: "13px 20px", marginTop: 4 }}
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
          {!inApp && (
            <a href="/api/auth/google?admin=1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 20px", borderRadius: 999, background: "#fff", color: "#1F2B2C", fontWeight: 600, fontSize: ".92rem" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Continue with Google
            </a>
          )}
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: ".8rem", color: "rgba(255,255,255,.4)" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,.6)" }}>← Back to Health365</Link>
        </p>
      </div>
    </main>
  );
}
