"use client";

import { useState } from "react";
import Link from "next/link";

const DEFAULT_LABELS = ["Lose Weight", "Gain Weight", "Eat Better", "Manage a Condition"];
const ICONS = ["🎯", "💪", "🥗", "🩺"];
const DESCRIPTIONS = [
  "A steady, sustainable plan built around your goals, not a crash diet.",
  "Build up healthily with a plan that actually fits your routine.",
  "Small, everyday changes that make eating well feel natural.",
  "Condition-specific guidance, reviewed by a real dietitian.",
];
const BG_CLASSES = ["luma-sage-bg", "luma-cream-bg", "luma-blue-bg", "luma-tan-bg"];

export default function GoalCards({ labels }: { labels?: string[] }) {
  const goalLabels = labels && labels.length === 4 ? labels : DEFAULT_LABELS;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="luma-service-grid">
        {goalLabels.map((label, i) => (
          <div
            key={i}
            className={`luma-service-card ${BG_CLASSES[i]}${selected === label ? " selected" : ""}`}
            onClick={() => setSelected(label)}
          >
            <div className="top-row">
              <span className="ic-circle">{ICONS[i]}</span>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <h3>{label}</h3>
              <p>{DESCRIPTIONS[i]}</p>
              <span className="learn">Select goal →</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 26, opacity: selected ? 1 : 0, transition: "opacity .3s ease" }}>
        Good pick — we&apos;ll shape your consultation around <strong>{selected}</strong>.
        {selected && (
          <>
            {" "}
            <Link href={`/consultation?goal=${encodeURIComponent(selected)}`} style={{ color: "var(--sage-deep)", fontWeight: 600 }}>
              Continue →
            </Link>
          </>
        )}
      </p>
    </>
  );
}
