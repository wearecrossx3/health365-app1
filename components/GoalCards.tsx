"use client";

import { useState } from "react";
import Link from "next/link";

const GOALS = [
  { goal: "Lose Weight", photo: "ph-teal" },
  { goal: "Gain Weight", photo: "ph-sand" },
  { goal: "Eat Better", photo: "ph-terra" },
  { goal: "Manage a Condition", photo: "ph-rose" },
];

export default function GoalCards() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="service-grid">
        {GOALS.map((g) => (
          <div
            key={g.goal}
            className={`service-card${selected === g.goal ? " selected" : ""}`}
            onClick={() => setSelected(g.goal)}
          >
            <div className={`photo ${g.photo} grain`} />
            <h3>{g.goal}</h3>
            <span className="pick">Select goal →</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 26, opacity: selected ? 1 : 0, transition: "opacity .3s ease" }}>
        Good pick — we&apos;ll shape your consultation around <strong>{selected}</strong>.
        {selected && (
          <>
            {" "}
            <Link href={`/consultation?goal=${encodeURIComponent(selected)}`} style={{ color: "var(--terracotta)", fontWeight: 600 }}>
              Continue →
            </Link>
          </>
        )}
      </p>
    </>
  );
}
