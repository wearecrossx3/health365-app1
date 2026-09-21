"use client";

import { useState } from "react";
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
    router.push("/admin");
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0F1613", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", marginBottom: 18 }}>
            <Logo variant="light" height={26} />
          </div>
          <h1 style={{ fontFamily: "var(--font-instrument), sans-serif", fontWeight: 600, fontSize: "1.5rem", color: "#fff" }}>Admin Portal</h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".88rem", marginTop: 6 }}>Sign in to manage Health365</p>
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
            <Link href="/contact" style={{ fontSize: ".82rem", color: "var(--mint)" }}>Forgot password?</Link>
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
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: ".8rem", color: "rgba(255,255,255,.4)" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,.6)" }}>← Back to Health365</Link>
        </p>
      </div>
    </main>
  );
}
