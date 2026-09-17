"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";

interface Dietitian {
  name: string; role: string; verified: boolean; specializations: string[];
  languages: string[]; experienceYears: number; experienceBand: string;
  location: string; bio: string; qualNote: string;
}

const dietitians: Dietitian[] = [
  {
    name: "Dr. Astha Jadeja", role: "Founder & Lead Dietitian", verified: true,
    specializations: ["Diabetes", "PCOS", "Weight Management", "Thyroid"],
    languages: ["English", "Hindi", "Gujarati"], experienceYears: 8, experienceBand: "7+",
    location: "Gujarat, India",
    bio: "Dr. Astha Jadeja leads the nutrition philosophy behind Health365 — practical, judgement-free guidance built for real Indian kitchens and real routines.",
    qualNote: "Qualifications & credentials placeholder — connect Dr. Astha's verified details here before launch.",
  },
];

const SPECIALIZATIONS = ["Diabetes", "PCOS", "Weight Management", "Thyroid"];
const LANGUAGES = ["English", "Hindi", "Gujarati"];
const EXPERIENCE = ["0-3", "3-7", "7+"];

export default function DietitiansPage() {
  const [spec, setSpec] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [exp, setExp] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const results = dietitians.filter((d) => {
    if (spec && !d.specializations.includes(spec)) return false;
    if (lang && !d.languages.includes(lang)) return false;
    if (exp && d.experienceBand !== exp) return false;
    return true;
  });

  const open = openIndex !== null ? results[openIndex] : null;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 1080, paddingTop: 56, paddingBottom: 90 }}>
          <div style={{ marginBottom: 36, maxWidth: 640 }}>
            <span className="eyebrow">Dietitian Directory</span>
            <h1 style={{ fontSize: "clamp(2rem,4vw,2.8rem)" }}>Find your dietitian.</h1>
            <p style={{ marginTop: 14, fontSize: "1.04rem" }}>Filter by specialization, language, or experience — every profile is reviewed before it goes live.</p>
          </div>

          <div className="filters">
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
                  {EXPERIENCE.map((e) => (
                    <span key={e} className={`toggle-opt${exp === e ? " on" : ""}`} onClick={() => setExp(exp === e ? null : e)}>{e === "7+" ? "7+ yrs" : `${e} yrs`}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>More dietitians joining soon</h3>
              <p>Health365 is onboarding qualified dietitians across specializations. Adjust your filters, or check back shortly — or start with Dr. Astha Jadeja in the meantime.</p>
            </div>
          ) : (
            <div className="directory-grid">
              {results.map((d, i) => (
                <div className="dcard" key={d.name} onClick={() => setOpenIndex(i)}>
                  <div className="avatar ph-rose grain" style={{ borderRadius: 18 }} />
                  <div>
                    <h3>{d.name} {d.verified && <span className="verified">Verified</span>}</h3>
                    <p className="meta">{d.role} · {d.experienceYears} yrs experience · {d.location}</p>
                    <div className="tags">{d.specializations.map((s) => <span key={s}>{s}</span>)}</div>
                  </div>
                  <button className="pill pill-outline" style={{ padding: "9px 18px", fontSize: ".8rem" }}>View Profile</button>
                </div>
              ))}
            </div>
          )}

          {open && (
            <div style={{ marginTop: 20 }}>
              <div className="profile-card">
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
                    </div>
                    <p className="note">{open.qualNote}</p>
                    <div className="profile-cta">
                      <a href="/consultation" className="pill pill-primary" style={{ background: "var(--mint)", color: "var(--dark)" }}>Book a Consultation</a>
                      <button className="pill pill-outline" style={{ background: "transparent", borderColor: "rgba(255,255,255,.3)", color: "#fff" }} onClick={() => setOpenIndex(null)}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
