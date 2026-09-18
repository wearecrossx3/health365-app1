"use client";

import { useState } from "react";
import Link from "next/link";

const PHOTOS = ["ph-teal", "ph-sand", "ph-terra", "ph-rose"];
const DEFAULT_LABELS = ["Lose Weight", "Gain Weight", "Eat Better", "Manage a Condition"];

export default function GoalCards({ labels }: { labels?: string[] }) {
  const goalLabels = labels && labels.length === 4 ? labels : DEFAULT_LABELS;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="service-grid">
        {goalLabels.map((label, i) => (
          <div
            key={i}
            className={`service-card${selected === label ? " selected" : ""}`}
            onClick={() => setSelected(label)}
          >
            <div className={`photo ${PHOTOS[i]} grain`} />
            <h3>{label}</h3>
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
