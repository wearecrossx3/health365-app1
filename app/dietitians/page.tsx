"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BookingWidget from "@/components/BookingWidget";
import { SPECIALIZATIONS } from "@/lib/dietConditions";

interface Dietitian {
  id: string; name: string; role: string; verified: boolean; specializations: string[];
  languages: string[]; experienceYears: number;
  location: string; bio: string; qualNote: string; fee?: string;
}

const ASTHA_DEFAULT: Dietitian = {
  id: "dr-astha", name: "Dr. Astha Jadeja", role: "Founder & Lead Dietitian", verified: true,
  specializations: ["Diabetes", "PCOS", "Weight Management", "Thyroid"],
  languages: ["English", "Hindi", "Gujarati"], experienceYears: 8,
  location: "Gujarat, India",
  bio: "Dr. Astha Jadeja leads the nutrition philosophy behind Health365 — practical, judgement-free guidance built for real Indian kitchens and real routines.",
  qualNote: "",
};

function splitList(value: string, fallback: string[]): string[] {
  const list = (value || "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : fallback;
}

const LANGUAGES = ["English", "Hindi", "Gujarati"];

function experienceBand(years: number) {
  if (years >= 7) return "7+";
  if (years >= 3) return "3-7";
  return "0-3";
}

function DietitiansContent() {
  const params = useSearchParams();
  const urlCondition = params.get("condition") || "";
  const prefillName = params.get("name") || "";
  const prefillPhone = params.get("phone") || "";
  const paidFlow = !!urlCondition;

  const [astha, setAstha] = useState<Dietitian>(ASTHA_DEFAULT);
  const [approved, setApproved] = useState<Dietitian[]>([]);
  const dietitians = [astha, ...approved];
  const [spec, setSpec] = useState<string | null>(SPECIALIZATIONS.includes(urlCondition) ? urlCondition : null);
  const [lang, setLang] = useState<string | null>(null);
  const [exp, setExp] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Dr. Astha's directory card is admin-editable (Admin → Site Content →
  // "Dr. Astha's profile") — pull her specializations, languages,
  // experience, location and fee from there instead of hardcoding them.
  useEffect(() => {
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) => {
        setAstha({
          id: "dr-astha",
          name: d.asthaName || ASTHA_DEFAULT.name,
          role: d.asthaRole || ASTHA_DEFAULT.role,
          verified: true,
          specializations: splitList(d.asthaSpecializations, ASTHA_DEFAULT.specializations),
          languages: splitList(d.asthaLanguages, ASTHA_DEFAULT.languages),
          experienceYears: Number(d.asthaExperienceYears) || ASTHA_DEFAULT.experienceYears,
          location: d.asthaLocation || ASTHA_DEFAULT.location,
          bio: d.asthaBio || ASTHA_DEFAULT.bio,
          qualNote: "",
          fee: d.asthaFee || undefined,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/dietitians")
      .then((r) => r.json())
      .then((data) => {
        const list: Dietitian[] = (data.dietitians || []).map((d: { id: string; name: string; qualification: string; experienceYears: number; specializations: string[]; languages: string[]; location: string; about: string; fee: string; }) => ({
          id: d.id,
          name: d.name,
          role: d.qualification,
          verified: true,
          specializations: d.specializations,
          languages: d.languages,
          experienceYears: d.experienceYears,
          location: d.location,
          bio: d.about || "This dietitian has joined the Health365 network.",
          qualNote: "",
          fee: d.fee,
        }));
        setApproved(list);
      })
      .catch(() => {});
  }, []);

  const results = dietitians.filter((d) => {
    if (spec && !d.specializations.includes(spec)) return false;
    if (lang && !d.languages.includes(lang)) return false;
    if (exp && experienceBand(d.experienceYears) !== exp) return false;
    return true;
  });

  const open = openIndex !== null ? results[openIndex] : null;

  return (
    <>
      <main>
        <div className="wrap" style={{ maxWidth: 1080, paddingTop: 56, paddingBottom: 90 }}>
          <Reveal style={{ marginBottom: 36, maxWidth: 640 }}>
            <span className="eyebrow">Dietitian Directory</span>
            <h1 style={{ fontSize: "clamp(2rem,4vw,2.8rem)" }}>Find your dietitian.</h1>
            <p style={{ marginTop: 14, fontSize: "1.04rem" }}>Filter by specialization, language, or experience — every profile is reviewed before it goes live.</p>
          </Reveal>

          {paidFlow && (
            <div style={{ background: "#EAF3EF", border: "1px solid var(--teal)", borderRadius: 14, padding: "14px 20px", marginBottom: 28 }}>
              <p style={{ fontSize: ".9rem", color: "var(--teal-deep)", fontWeight: 600 }}>
                Booking a consultation{urlCondition ? ` for ${urlCondition}` : ""}
                {prefillName ? ` — ${prefillName}` : ""}
              </p>
              <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", marginTop: 4 }}>
                Pick a dietitian below, choose a time, and you&apos;ll see pricing on the next step.
              </p>
            </div>
          )}

          <Reveal delay={100} className="filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Specialization</label>
                <div className="toggle-group">
                  {SPECIALIZATIONS.map((s) => (
                    <span key={s} className={`toggle-opt${spec === s ? " on" : ""}`} onClick={() => setSpec(spec === s ? null : s)}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Language</label>
                <div className="toggle-group">
                  {LANGUAGES.map((l) => (
                    <span key={l} className={`toggle-opt${lang === l ? " on" : ""}`} onClick={() => setLang(lang === l ? null : l)}>{l}</span>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Experience</label>
                <div className="toggle-group">
                  {["0-3", "3-7", "7+"].map((e) => (
                    <span key={e} className={`toggle-opt${exp === e ? " on" : ""}`} onClick={() => setExp(exp === e ? null : e)}>{e === "7+" ? "7+ yrs" : `${e} yrs`}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>More dietitians joining soon</h3>
              <p>Health365 is onboarding qualified dietitians across specializations. Adjust your filters, or check back shortly — or start with Dr. Astha Jadeja in the meantime.</p>
            </div>
          ) : (
            <div className="directory-grid">
              {results.map((d, i) => (
                <Reveal key={d.name} delay={i * 60} className="dcard" style={{ cursor: "pointer" }}>
                  <div onClick={() => setOpenIndex(i)} style={{ display: "contents" }}>
                    <div className="avatar ph-rose grain" style={{ borderRadius: 18 }} />
                    <div>
                      <h3>{d.name} {d.verified && <span className="verified">Verified</span>}</h3>
                      <p className="meta">{d.role} · {d.experienceYears} yrs experience · {d.location}</p>
                      <div className="tags">{d.specializations.map((s) => <span key={s}>{s}</span>)}</div>
                    </div>
                    <button className="pill pill-outline" style={{ padding: "9px 18px", fontSize: ".8rem" }}>View Profile</button>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {open && (
            <div style={{ marginTop: 20 }}>
              <div className="profile-card">
                <button
                  onClick={() => setOpenIndex(null)}
                  aria-label="Close"
                  style={{ position: "absolute", top: 18, right: 18, background: "var(--paper)", border: "none", color: "var(--ink)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
                >
                  ×
                </button>
                <div className="profile-grid">
                  <div className="profile-avatar ph-rose grain" />
                  <div>
                    <span className="role">{open.role}</span>
                    <h2>{open.name}</h2>
                    <p className="bio">{open.bio}</p>
                    <div className="profile-meta">
                      <div className="m">Experience<b>{open.experienceYears} years</b></div>
                      <div className="m">Languages<b>{open.languages.join(", ")}</b></div>
                      <div className="m">Specializations<b>{open.specializations.join(", ")}</b></div>
                      <div className="m">Location<b>{open.location}</b></div>
                      {open.fee && <div className="m">Fee<b>{open.fee}</b></div>}
                    </div>
                    <a href="/consultation" style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--teal-deep)", display: "inline-block", marginTop: 14 }}>
                      Prefer a full intake instead? Start a consultation →
                    </a>
                  </div>
                </div>
                <div className="profile-booking-box">
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: ".9rem", marginBottom: 2 }}>Book an appointment</p>
                  <BookingWidget
                    dietitianId={open.id}
                    dietitianName={open.name}
                    paidFlow={paidFlow}
                    prefillName={prefillName}
                    prefillPhone={prefillPhone}
                    conditionLabel={urlCondition}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function DietitiansPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <DietitiansContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}
