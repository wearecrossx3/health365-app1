"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { useAuthModal } from "@/components/AuthModalProvider";

const SPECIALIZATIONS = ["Diabetes", "PCOS", "Weight Management", "Thyroid", "Cholesterol", "Digestive Health"];
const LANGUAGES = ["English", "Hindi", "Gujarati"];

export default function JoinAsDietitianPage() {
  const { open } = useAuthModal();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [fee, setFee] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(async (d) => {
        setLoggedIn(!!d.user);
        if (d.user) {
          const res = await fetch("/api/dietitians/apply");
          const data = await res.json();
          if (data.application) setStatus(data.application.status);
        }
      })
      .finally(() => setCheckedAuth(true));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!qualification.trim() || !location.trim()) {
      setError("Please fill in your qualification and location.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/dietitians/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualification, experienceYears, specializations, languages, location, fee, about }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setSubmitted(true);
    setStatus("pending");
  }

  if (!checkedAuth) return null;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 720, paddingTop: 56, paddingBottom: 90 }}>
          <Reveal>
            <span className="eyebrow">Join Health365</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>Join as a dietitian</h1>
            <p style={{ marginTop: 14, fontSize: "1.02rem", maxWidth: "56ch" }}>
              Tell us about your qualifications and specializations. Every application is reviewed by our team before going live in the directory.
            </p>
          </Reveal>

          {!loggedIn ? (
            <div className="step-card" style={{ marginTop: 32, textAlign: "center" }}>
              <h2 style={{ fontSize: "1.4rem", marginBottom: 10 }}>Log in to apply</h2>
              <p style={{ marginBottom: 22 }}>Create a free account so we can review and contact you about your application.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="pill pill-primary" onClick={() => open("signup")}>Create an account</button>
                <button className="pill pill-outline" onClick={() => open("login")}>Log in</button>
              </div>
            </div>
          ) : submitted || status === "pending" ? (
            <div className="step-card" style={{ marginTop: 32, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 16px" }}>✓</div>
              <h2 style={{ fontSize: "1.4rem" }}>Application submitted</h2>
              <p style={{ marginTop: 10 }}>We'll review your details and get in touch once it's approved. You can check back here anytime.</p>
              <Link href="/" className="pill pill-outline" style={{ marginTop: 20, display: "inline-block" }}>Back to Health365</Link>
            </div>
          ) : status === "approved" ? (
            <div className="step-card" style={{ marginTop: 32, textAlign: "center" }}>
              <h2 style={{ fontSize: "1.4rem" }}>You're approved 🎉</h2>
              <p style={{ marginTop: 10 }}>Your profile is live in the Health365 directory.</p>
              <Link href="/dietitian-dashboard" className="pill pill-primary" style={{ marginTop: 20, display: "inline-block" }}>Go to your dashboard</Link>
            </div>
          ) : (
            <Reveal delay={120} className="step-card" style={{ marginTop: 32 }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div className="field">
                  <label>Qualification</label>
                  <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc Clinical Nutrition" />
                </div>
                <div className="field">
                  <label>Years of experience</label>
                  <input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="e.g. 5" />
                </div>
                <div className="field">
                  <label>Specializations</label>
                  <div className="toggle-group">
                    {SPECIALIZATIONS.map((s) => (
                      <span key={s} className={`toggle-opt${specializations.includes(s) ? " on" : ""}`} onClick={() => toggle(specializations, setSpecializations, s)}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Languages</label>
                  <div className="toggle-group">
                    {LANGUAGES.map((l) => (
                      <span key={l} className={`toggle-opt${languages.includes(l) ? " on" : ""}`} onClick={() => toggle(languages, setLanguages, l)}>{l}</span>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ahmedabad, Gujarat" />
                </div>
                <div className="field">
                  <label>Consultation fee <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional, shown as a range</span></label>
                  <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g. ₹500–800 per session" />
                </div>
                <div className="field">
                  <label>About you <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional</span></label>
                  <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="A short bio for your public profile." />
                </div>
                {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
                <button type="submit" disabled={submitting} className="pill pill-primary" style={{ textAlign: "center" }}>
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
