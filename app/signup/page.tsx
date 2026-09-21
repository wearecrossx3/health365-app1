"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
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
          <h1 className="font-display text-2xl mb-2">Create your account</h1>
          <p className="text-inksoft text-sm mb-8">
            One account to save your consultations and plans.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
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
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-terracotta font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="pill pill-primary w-full text-center">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-sm text-inksoft mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-ink font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
