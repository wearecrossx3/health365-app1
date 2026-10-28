"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { useAuthModal } from "@/components/AuthModalProvider";
import { SPECIALIZATIONS } from "@/lib/dietConditions";
import DietitianTermsText from "@/components/DietitianTermsText";

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
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(async (d) => {
        setLoggedIn(!!d.user);
        if (d.user) {
          const res = await fetch("/api/dietitians/apply");
          const data = await res.json();
          if (data.application) setStatus(data.application.status);
          if (data.phone) setPhone(data.phone);
        }
      })
      .finally(() => setCheckedAuth(true));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  async function handleSubmit(e?: React.FormEvent, accepted = agreed) {
    e?.preventDefault();
    setError(null);
    if (!qualification.trim() || !location.trim()) {
      setError("Please fill in your qualification and location.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))) {
      setError("Please enter your 10-digit mobile number.");
      return;
    }
    // The terms come up first; the application goes in only after "I agree".
    if (!accepted) { setShowTerms(true); return; }
    setSubmitting(true);
    const res = await fetch("/api/dietitians/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualification, experienceYears, specializations, languages, location, phone, fee, about, termsAccepted: true }),
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

          {!checkedAuth ? (
            <div className="step-card" style={{ marginTop: 32, textAlign: "center", color: "var(--ink-soft)" }}>
              Loading…
            </div>
          ) : !loggedIn ? (
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
              <p style={{ marginTop: 10 }}>We'll review your details and email you once it's approved. You can check back here anytime.</p>
              <p style={{ marginTop: 10, fontSize: ".92rem", color: "var(--ink-soft)" }}>Once approved, you'll work from the <Link href="/dietitian-app" style={{ color: "var(--teal-deep)", fontWeight: 700 }}>H365 Dietitian app</Link>. You can download it now and log in after approval.</p>
              <Link href="/" className="pill pill-outline" style={{ marginTop: 20, display: "inline-block" }}>Back to Health365</Link>
            </div>
          ) : status === "approved" ? (
            <div className="step-card" style={{ marginTop: 32, textAlign: "center" }}>
              <h2 style={{ fontSize: "1.4rem" }}>You're approved 🎉</h2>
              <p style={{ marginTop: 10 }}>Your profile is live in the Health365 directory. Clients book you and chat with you in the H365 Dietitian app.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
                <Link href="/dietitian-app" className="pill pill-primary">⬇️ Get the Dietitian app</Link>
                <Link href="/admin/my-clients" className="pill pill-outline">Open on this device</Link>
              </div>
            </div>
          ) : (
            <Reveal delay={120} className="step-card" style={{ marginTop: 32 }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div className="field">
                  <label>Mobile number <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— WhatsApp, so our team can reach you</span></label>
                  <input type="tel" inputMode="numeric" autoComplete="tel" maxLength={14} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98765 43210" />
                </div>
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
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: ".92rem", lineHeight: 1.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18, accentColor: "var(--teal)" }} />
                  <span>I have read and agree to the <button type="button" onClick={() => setShowTerms(true)} style={{ background: "none", border: 0, padding: 0, color: "var(--teal-deep)", fontWeight: 700, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>Terms for dietitians</button>.</span>
                </label>
                {error && <p style={{ color: "var(--terracotta)", fontSize: ".9rem" }}>{error}</p>}
                <button type="submit" disabled={submitting} className="pill pill-primary" style={{ textAlign: "center" }}>
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </main>

      {showTerms && (
        <div role="dialog" aria-modal="true" aria-label="Terms for dietitians" onClick={() => setShowTerms(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,26,.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: "1.25rem" }}>Terms for dietitians</h2>
              <button type="button" aria-label="Close" onClick={() => setShowTerms(false)} style={{ width: 36, height: 36, borderRadius: 12, border: 0, background: "var(--paper)", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ padding: "16px 20px", overflowY: "auto" }}><DietitianTermsText compact /></div>
            <div style={{ padding: "12px 20px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="pill pill-outline" onClick={() => setShowTerms(false)}>Not now</button>
              <button type="button" className="pill pill-primary" disabled={submitting} onClick={() => { setAgreed(true); setShowTerms(false); handleSubmit(undefined, true); }}>
                I agree, submit application
              </button>
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </>
  );
}
