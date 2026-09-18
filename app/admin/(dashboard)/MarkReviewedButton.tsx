"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkReviewedButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/admin/consultations/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="pill pill-outline"
      style={{ padding: "6px 14px", fontSize: ".75rem" }}
    >
      {loading ? "Saving…" : "Mark reviewed"}
    </button>
  );
}
