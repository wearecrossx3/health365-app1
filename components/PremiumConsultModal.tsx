"use client";

import { useState } from "react";

export default function PremiumConsultModal({
  originalPrice,
  discountedPrice,
  upiId,
  planSummary,
  onClose,
  prefillName,
  prefillPhone,
  booking,
  onBooked,
}: {
  originalPrice: string;
  discountedPrice: string;
  upiId: string;
  planSummary: string;
  onClose: () => void;
  prefillName?: string;
  prefillPhone?: string;
  // When set, a successful payment confirmation also reserves this exact
  // appointment slot — used when this modal is opened from the booking
  // flow rather than the free-plan page.
  booking?: { dietitianId: string; dietitianName: string; date: string; time: string };
  onBooked?: () => void;
}) {
  const [step, setStep] = useState<"package" | "payment" | "done">("package");
  const [name, setName] = useState(prefillName || "");
  const [phone, setPhone] = useState(prefillPhone || "");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&am=${encodeURIComponent(discountedPrice)}&cu=INR&tn=${encodeURIComponent("Health365 dietitian consultation")}`
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("Please share your name and phone number.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/premium-consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, planSummary }),
    });
    if (booking) {
      // Best-effort — the payment-confirmation message above is what
      // actually reaches the team, so a booking race (slot just taken)
      // shouldn't block showing the success step.
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      }).catch(() => {});
    }
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — please try again.");
      return;
    }
    onBooked?.();
    setStep("done");
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,24,18,.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", background: "#fff", borderRadius: 24, maxWidth: 440, width: "100%",
          padding: "40px 36px", boxShadow: "0 40px 80px -20px rgba(0,0,0,.4)",
          animation: "modalPopIn .35s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%",
            background: "var(--paper)", border: "none", fontSize: "1.1rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ×
        </button>

        {step === "package" && (
          <>
            <span className="eyebrow">1:1 Consultation</span>
            <h2 style={{ fontSize: "1.4rem", marginTop: 6 }}>Talk to a real dietitian</h2>
            <p style={{ fontSize: ".9rem", color: "var(--ink-soft)", marginTop: 10, lineHeight: 1.6 }}>
              Get your plan reviewed and personalized — tailored to your goals, checked for safety, with
              follow-up support as you go.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
              <span style={{ fontSize: "1rem", color: "var(--ink-soft)", textDecoration: "line-through" }}>₹{originalPrice}</span>
              <span style={{ fontSize: "1.8rem", fontWeight: 700 }}>₹{discountedPrice}</span>
            </div>
            <button
              type="button"
              className="pill pill-primary"
              style={{ width: "100%", textAlign: "center", marginTop: 22, padding: "13px 20px" }}
              onClick={() => setStep("payment")}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "var(--ink-soft)", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}
            >
              Maybe later
            </button>
          </>
        )}

        {step === "payment" && (
          <>
            <span className="eyebrow">Step 2 of 2</span>
            <h2 style={{ fontSize: "1.3rem", marginTop: 6 }}>Complete your payment</h2>
            <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", marginTop: 8 }}>
              Pay ₹{discountedPrice} via UPI, then confirm below — we&apos;ll reach out to schedule your consultation.
            </p>

            {upiId ? (
              <div style={{ background: "var(--paper)", borderRadius: 14, padding: "16px 18px", marginTop: 16 }}>
                <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>UPI ID</p>
                <p style={{ fontSize: ".95rem", fontWeight: 600, marginTop: 4 }}>{upiId}</p>
                <a href={upiLink} className="pill pill-outline" style={{ display: "inline-block", marginTop: 12, padding: "9px 18px", fontSize: ".82rem" }}>
                  Pay via UPI app
                </a>
              </div>
            ) : (
              <p style={{ fontSize: ".85rem", color: "var(--terracotta)", marginTop: 16 }}>
                Payment details aren&apos;t set up yet — submit your details below and we&apos;ll reach out to arrange payment directly.
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".9rem" }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".9rem" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: ".9rem" }}
              />
              {error && <p style={{ color: "var(--terracotta)", fontSize: ".8rem" }}>{error}</p>}
              <button type="submit" disabled={submitting} className="pill pill-primary" style={{ textAlign: "center", padding: "13px 20px" }}>
                {submitting ? "Submitting…" : "I've completed the payment"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", margin: "0 auto 16px" }}>✓</div>
            <h2 style={{ fontSize: "1.25rem" }}>{booking ? "Appointment requested" : "Request received"}</h2>
            <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", marginTop: 8 }}>
              {booking
                ? `Thanks — we'll verify your payment and confirm your appointment with ${booking.dietitianName} on ${new Date(booking.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at ${booking.time}.`
                : "Thanks — we'll verify your payment and reach out within 24 hours to schedule your consultation."}
            </p>
            <button type="button" onClick={onClose} className="pill pill-outline" style={{ marginTop: 20, padding: "10px 22px" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
