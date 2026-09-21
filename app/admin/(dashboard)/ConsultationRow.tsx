"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkReviewedButton from "./MarkReviewedButton";

interface Consultation {
  id: string;
  goal: string;
  dietType: string;
  allergens: string[];
  conditions: string[];
  createdAt: string;
  status: "submitted" | "reviewed";
  raw: Record<string, unknown>;
}

function field(raw: Record<string, unknown>, key: string): string {
  const v = raw?.[key];
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

export default function ConsultationRow({ c }: { c: Consultation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const flagged = c.conditions.length > 0;

  async function handleDelete() {
    if (!confirm("Delete this consultation? This can't be undone.")) return;
    setDeleting(true);
    await fetch("/api/admin/consultations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    router.refresh();
  }

  return (
    <div
      style={{
        border: "1.5px solid var(--line)", borderRadius: 14, padding: "14px 18px",
        background: flagged && c.status === "submitted" ? "#F7E7DC" : "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <div>
          <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{c.goal} · {c.dietType}</p>
          <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 4 }}>
            {new Date(c.createdAt).toLocaleDateString()} · Allergies: {c.allergens.join(", ") || "none"} · Conditions: {c.conditions.join(", ") || "none"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: ".72rem", fontWeight: 700, padding: "5px 11px", borderRadius: 100,
              background: c.status === "reviewed" ? "var(--teal)" : "var(--ink)", color: "#fff",
            }}
          >
            {c.status === "reviewed" ? "Reviewed" : "Pending"}
          </span>
          <span style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div><span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>Name</span><p style={{ fontSize: ".88rem", fontWeight: 600 }}>{field(c.raw, "fullName")}</p></div>
            <div><span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>Mobile</span><p style={{ fontSize: ".88rem", fontWeight: 600 }}>{field(c.raw, "phone")}</p></div>
            <div><span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>Age / Gender</span><p style={{ fontSize: ".88rem", fontWeight: 600 }}>{field(c.raw, "age")} · {field(c.raw, "gender")}</p></div>
            <div><span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>Height / Weight</span><p style={{ fontSize: ".88rem", fontWeight: 600 }}>{field(c.raw, "height")}cm · {field(c.raw, "weight")}kg</p></div>
            <div><span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>Activity level</span><p style={{ fontSize: ".88rem", fontWeight: 600 }}>{field(c.raw, "activity")}</p></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {c.status !== "reviewed" && <MarkReviewedButton id={c.id} />}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="pill pill-outline"
              style={{ padding: "6px 14px", fontSize: ".75rem", color: "var(--terracotta)", borderColor: "var(--terracotta)" }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
