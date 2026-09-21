"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-16">
        <div className="card w-full max-w-md">
          <h1 className="font-display text-2xl mb-2">Welcome back</h1>
          <p className="text-inksoft text-sm mb-8">Log in to see your plans and consultations.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-terracotta font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="pill pill-primary w-full text-center">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
          <p className="text-sm text-inksoft mt-6">
            New to Health365?{" "}
            <Link href="/signup" className="text-ink font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
