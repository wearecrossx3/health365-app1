"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DietitianActionButtons({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  async function act(status: "approved" | "rejected") {
    setLoading(status);
    await fetch("/api/admin/dietitians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() => act("approved")}
        disabled={loading !== null}
        className="pill pill-primary"
        style={{ padding: "6px 14px", fontSize: ".75rem" }}
      >
        {loading === "approved" ? "…" : "Approve"}
      </button>
      <button
        onClick={() => act("rejected")}
        disabled={loading !== null}
        className="pill pill-outline"
        style={{ padding: "6px 14px", fontSize: ".75rem" }}
      >
        {loading === "rejected" ? "…" : "Reject"}
      </button>
    </div>
  );
}
