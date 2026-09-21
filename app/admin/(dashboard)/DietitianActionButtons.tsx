"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DietitianActionButtons({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(newStatus: "approved" | "rejected") {
    setLoading(newStatus);
    await fetch("/api/admin/dietitians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setLoading(null);
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm("Remove this dietitian? This can't be undone.")) return;
    setLoading("remove");
    await fetch("/api/admin/dietitians/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(null);
    router.refresh();
  }

  if (status === "pending") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => act("approved")} disabled={loading !== null} className="pill pill-primary" style={{ padding: "6px 14px", fontSize: ".75rem" }}>
          {loading === "approved" ? "…" : "Approve"}
        </button>
        <button onClick={() => act("rejected")} disabled={loading !== null} className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".75rem" }}>
          {loading === "rejected" ? "…" : "Reject"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading !== null}
      className="pill pill-outline"
      style={{ padding: "6px 14px", fontSize: ".75rem", color: "var(--terracotta)", borderColor: "var(--terracotta)" }}
    >
      {loading === "remove" ? "Removing…" : "Remove"}
    </button>
  );
}
