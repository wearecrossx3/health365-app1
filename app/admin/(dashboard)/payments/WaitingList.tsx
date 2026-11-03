"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type WaitRow = { id: string; client: string; phone: string; dietitian: string; date: string; time: string; bookedAt: string; price: number };

// Bookings with no payment at all (website bookings, or app bookings while UPI
// was off). Chat and plans stay closed until the owner marks them paid or free.
export default function WaitingList({ rows }: { rows: WaitRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  if (!rows.length) return null;
  const act = async (id: string, decision: "markPaid" | "markFree") => {
    if (!confirm(decision === "markPaid" ? "Mark as PAID (cash / bank / other)? The chat opens and the dietitian can send a plan." : "Give this consultation FREE? The chat opens and the dietitian can send a plan.")) return;
    setBusy(id);
    await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision }) }).catch(() => null);
    setBusy(""); router.refresh();
  };
  return (
    <div className="panel" style={{ marginTop: 22, borderColor: "#F0C987" }}>
      <h2 style={{ fontSize: "1.1rem" }}>⏳ Bookings waiting for payment ({rows.length})</h2>
      <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: "6px 0 12px" }}>
        No payment was sent for these. The client and dietitian can&apos;t chat and no plan can be sent until you mark them paid (after collecting the fee) or give them free.
      </p>
      {rows.map((r) => (
        <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: ".88rem" }}>
          <div style={{ flex: "1 1 220px" }}>
            <b>{r.client}</b> → {r.dietitian}<br />
            <span style={{ color: "var(--ink-soft)" }}>{r.date} {r.time} · fee ₹{r.price}{r.phone ? ` · 📞 ${r.phone}` : ""}</span>
          </div>
          {r.phone && <a className="pill pill-outline" style={{ padding: "6px 12px", fontSize: ".78rem" }} target="_blank" rel="noopener" href={`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Hi ${r.client.split(" ")[0]}, thanks for booking a consultation with ${r.dietitian} on Health365. To confirm it, please pay the consultation fee of ₹${r.price}. Reply here once done and we'll open your chat with the dietitian.`)}`}>🟢 Ask to pay</a>}
          <button className="pill pill-primary" disabled={busy === r.id} onClick={() => act(r.id, "markPaid")} style={{ padding: "6px 14px", fontSize: ".78rem" }}>✓ Mark paid</button>
          <button className="pill pill-outline" disabled={busy === r.id} onClick={() => act(r.id, "markFree")} style={{ padding: "6px 12px", fontSize: ".78rem" }}>🎁 Free</button>
        </div>
      ))}
    </div>
  );
}
