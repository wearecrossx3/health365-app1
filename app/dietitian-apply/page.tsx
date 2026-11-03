"use client";

import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { useAuthModal } from "@/components/AuthModalProvider";
import { SPECIALIZATIONS } from "@/lib/dietConditions";
import DietitianTermsText from "@/components/DietitianTermsText";

// The dietitian application inside the Health365 app ("I'm a dietitian" →
// Create an account and apply). App-style screens, no website header/footer:
// 1 details → 2 read & accept the terms → 3 under review. While waiting, it
// checks every 20 seconds and opens the portal by itself once approved.

const LANGUAGES = ["English", "Hindi", "Gujarati"];
type Status = "pending" | "approved" | "rejected" | null;

const card: React.CSSProperties = { background: "#fff", borderRadius: 22, padding: "20px 18px", boxShadow: "0 1px 0 rgba(31,43,44,.06)" };
const lbl: React.CSSProperties = { display: "block", fontSize: ".86rem", fontWeight: 700, margin: "0 0 7px", color: "#1F2B2C" };
const inp: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 14, border: "1.5px solid #E3E0D6", background: "#FFFDF8", fontSize: "1rem", color: "#1F2B2C" };
const chip = (on: boolean): React.CSSProperties => ({ padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${on ? "#287379" : "#E3E0D6"}`, background: on ? "#287379" : "#fff", color: on ? "#fff" : "#1F2B2C", fontWeight: 600, fontSize: ".88rem", cursor: "pointer" });
const btn = (dis = false): React.CSSProperties => ({ width: "100%", padding: "15px 18px", borderRadius: 16, border: 0, background: dis ? "#A9C4C6" : "#287379", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: dis ? "default" : "pointer" });

export default function DietitianApplyPage() {
  const { open } = useAuthModal();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [fee, setFee] = useState("");
  const [about, setAbout] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setLoggedIn(!!d.user);
    if (d.user) {
      setName(d.user.name || "");
      const a = await fetch("/api/dietitians/apply", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      const st: Status = a.application?.status || null;
      setStatus(st);
      if (a.phone) setPhone((p) => p || String(a.phone).replace(/^\+?91/, ""));
      if (st === "approved") window.location.href = "/api/auth/portal-open";
      return st;
    }
    return null;
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Waiting for approval: check every 20 seconds.
  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(() => { load(); }, 20000);
    return () => clearInterval(t);
  }, [status, load]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const cleanPhone = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");

  function next() {
    setError("");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return setError("Please enter your 10-digit mobile number.");
    if (!qualification.trim()) return setError("Please enter your qualification.");
    if (!location.trim()) return setError("Please enter your city.");
    setStep(2);
    window.scrollTo(0, 0);
  }

  async function submit() {
    if (!agreed) return;
    setBusy(true); setError("");
    const r = await fetch("/api/dietitians/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualification, experienceYears, specializations, languages, location, phone: cleanPhone, fee, about, termsAccepted: true }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setError(d.error || "Something went wrong — please try again."); return; }
    setStatus("pending");
    window.scrollTo(0, 0);
  }

  async function checkNow() {
    setChecking(true);
    const st = await load();
    setChecking(false);
    if (st === "pending") setError("Still under review. We'll notify you as soon as it's approved.");
  }

  const head = (title: string, sub?: string, stepTxt?: string) => (
    <div style={{ padding: "calc(18px + env(safe-area-inset-top)) 20px 6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo height={24} />
        <span style={{ background: "#287379", color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 99 }}>🩺 Dietitian</span>
      </div>
      {stepTxt && <p style={{ marginTop: 22, fontSize: ".8rem", fontWeight: 700, letterSpacing: ".06em", color: "#287379" }}>{stepTxt}</p>}
      <h1 style={{ fontSize: "1.75rem", lineHeight: 1.15, marginTop: stepTxt ? 6 : 22 }}>{title}</h1>
      {sub && <p style={{ marginTop: 8, color: "#5B6664", lineHeight: 1.5, fontSize: ".95rem" }}>{sub}</p>}
    </div>
  );

  let body: React.ReactNode;
  if (loading) {
    body = <>{head("Loading…")}</>;
  } else if (!loggedIn) {
    body = (<>
      {head("Join as a dietitian", "Log in or create your Health365 account to apply.")}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={btn()} onClick={() => open("signup")}>Create an account</button>
        <button style={{ ...btn(), background: "#fff", color: "#287379", border: "1.5px solid #287379" }} onClick={() => open("login")}>Log in</button>
      </div>
    </>);
  } else if (status === "pending") {
    body = (<>
      {head("Application under review", `Thanks${name ? `, ${name.split(" ")[0]}` : ""}! Our team checks every application, usually within 24–48 hours.`)}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          {[["✅", "Details sent", "We have your qualification and contact details."], ["✅", "Terms accepted", "You agreed to the Terms for dietitians."], ["⏳", "Team review", "We may call or WhatsApp you to verify your documents."], ["🎉", "Start working", "As soon as you're approved, this screen opens your dietitian portal by itself."]].map(([i, t, d], k) => (
            <div key={t} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: k ? "1px solid #F0EDE4" : 0 }}>
              <span style={{ fontSize: 20, width: 28 }}>{i}</span>
              <div><b>{t}</b><p style={{ margin: "2px 0 0", fontSize: ".88rem", color: "#5B6664" }}>{d}</p></div>
            </div>
          ))}
        </div>
        <button style={btn(checking)} disabled={checking} onClick={checkNow}>{checking ? "Checking…" : "Check status now"}</button>
        {error && <p style={{ color: "#5B6664", fontSize: ".88rem", textAlign: "center" }}>{error}</p>}
        <p style={{ fontSize: ".82rem", color: "#7A8482", textAlign: "center" }}>You can close the app. Next time you open it, it takes you straight to your portal once you&apos;re approved.</p>
      </div>
    </>);
  } else if (status === "rejected") {
    body = (<>
      {head("Application not approved", "We couldn't approve your application this time. Please contact the Health365 team on WhatsApp if you think this is a mistake.")}
    </>);
  } else if (status === "approved") {
    body = <>{head("You're approved 🎉", "Opening your dietitian portal…")}</>;
  } else if (step === 1) {
    body = (<>
      {head("Your details", "Tell us about yourself. Our team reviews every application before your profile goes live.", "STEP 1 OF 2")}
      <div style={{ padding: "14px 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Mobile number (WhatsApp) *</label><input style={inp} type="tel" inputMode="numeric" maxLength={14} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" /></div>
          <div><label style={lbl}>Qualification *</label><input style={inp} value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc Clinical Nutrition" /></div>
          <div><label style={lbl}>Years of experience</label><input style={inp} type="number" inputMode="numeric" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="e.g. 2 (0 if you're a fresher)" /></div>
          <div><label style={lbl}>City *</label><input style={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Rajkot, Gujarat" /></div>
        </div>
        <div style={card}>
          <label style={lbl}>What do you specialise in?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SPECIALIZATIONS.map((s) => <span key={s} style={chip(specializations.includes(s))} onClick={() => toggle(specializations, setSpecializations, s)}>{s}</span>)}</div>
          <label style={{ ...lbl, marginTop: 18 }}>Languages you speak</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{LANGUAGES.map((l) => <span key={l} style={chip(languages.includes(l))} onClick={() => toggle(languages, setLanguages, l)}>{l}</span>)}</div>
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Consultation fee you'd like (optional)</label><input style={inp} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g. ₹299" /></div>
          <div><label style={lbl}>About you (optional)</label><textarea style={{ ...inp, minHeight: 96 }} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A short bio for your profile" /></div>
        </div>
        {error && <p style={{ color: "#B03A2E", fontSize: ".9rem" }}>{error}</p>}
        <button style={btn()} onClick={next}>Next: read the terms →</button>
      </div>
    </>);
  } else {
    body = (<>
      {head("Terms for dietitians", "Please read these before you apply. They explain how consultations, payments and client privacy work on Health365.", "STEP 2 OF 2")}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ ...card, maxHeight: "52vh", overflowY: "auto" }}><DietitianTermsText compact /></div>
      </div>
      <div style={{ position: "sticky", bottom: 0, background: "#FBF6EC", padding: "14px 20px calc(16px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: ".95rem", lineHeight: 1.45, cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 20, height: 20, accentColor: "#287379", flex: "none" }} />
          <span>I have read and I agree to the Terms for dietitians.</span>
        </label>
        {error && <p style={{ color: "#B03A2E", fontSize: ".9rem" }}>{error}</p>}
        <button style={btn(!agreed || busy)} disabled={!agreed || busy} onClick={submit}>{busy ? "Sending…" : "I agree — submit my application"}</button>
        <button style={{ background: "none", border: 0, color: "#287379", fontWeight: 700, padding: 6 }} onClick={() => { setStep(1); setError(""); }}>← Back to my details</button>
      </div>
    </>);
  }

  return <main style={{ minHeight: "100vh", background: "#FBF6EC", color: "#1F2B2C", maxWidth: 560, margin: "0 auto" }}>{body}</main>;
}
