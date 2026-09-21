"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  userName: string;
  dietitianName: string;
  date: string;
  time: string;
  status: "booked" | "cancelled";
  createdAt: string;
}

export default function AppointmentRow({ a }: { a: Appointment }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this appointment? This can't be undone.")) return;
    setBusy(true);
    await fetch("/api/admin/appointments/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id }),
    });
    router.refresh();
  }

  async function handleReject() {
    setBusy(true);
    await fetch("/api/admin/appointments/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, status: "cancelled" }),
    });
    router.refresh();
  }

  return (
    <div style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", flexWrap: "wrap", gap: 6, cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontWeight: 600 }}>{a.userName} → {a.dietitianName}</span>
        <span style={{ color: "var(--ink-soft)" }}>{new Date(a.date).toLocaleDateString()} · {a.time}</span>
        <span style={{ fontSize: ".72rem", fontWeight: 700, color: a.status === "booked" ? "var(--teal-deep)" : "var(--terracotta)" }}>
          {a.status === "booked" ? "Booked" : "Cancelled"}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Submitted {new Date(a.createdAt).toLocaleDateString()}</span>
          {a.status === "booked" && (
            <button onClick={handleReject} disabled={busy} className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".75rem" }}>
              {busy ? "…" : "Reject"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="pill pill-outline"
            style={{ padding: "6px 14px", fontSize: ".75rem", color: "var(--terracotta)", borderColor: "var(--terracotta)" }}
          >
            {busy ? "…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
