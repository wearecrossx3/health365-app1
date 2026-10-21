import { TERMS, TERMS_INTRO, TERMS_UPDATED } from "@/lib/dietitianTerms";

// The dietitian terms, as plain blocks. Used on /dietitian-terms, in the
// join form pop-up and in the Dietitian app's accept screen.
export default function DietitianTermsText({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 16, lineHeight: 1.55 }}>
      <p style={{ fontSize: compact ? ".88rem" : ".95rem", color: "var(--ink-soft, #55615F)" }}>{TERMS_INTRO} Last updated {TERMS_UPDATED}.</p>
      {TERMS.map((s, i) => (
        <div key={s.h}>
          <h3 style={{ fontSize: compact ? ".98rem" : "1.05rem", marginBottom: 6 }}>{i + 1}. {s.h}</h3>
          <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 5, fontSize: compact ? ".86rem" : ".93rem", color: "var(--ink-soft, #55615F)" }}>
            {s.items.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
