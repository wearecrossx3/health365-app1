"use client";

import { useEffect, useState } from "react";
import { useAuthModal } from "./AuthModalProvider";
import PremiumConsultModal from "./PremiumConsultModal";

const TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

function nextDays(n: number) {
  const out: { label: string; value: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return out;
}

export default function BookingWidget({
  dietitianId,
  dietitianName,
  paidFlow,
  prefillName,
  prefillPhone,
  conditionLabel,
}: {
  dietitianId: string;
  dietitianName: string;
  // When set, confirming a slot opens the paid-consultation pricing flow
  // (payment step, then the appointment is booked) instead of booking
  // the free slot directly — used when arriving here from the "Manage a
  // condition" path on the diet-plan page.
  paidFlow?: boolean;
  prefillName?: string;
  prefillPhone?: string;
  conditionLabel?: string;
}) {
  const { open } = useAuthModal();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const days = nextDays(7);
  const [date, setDate] = useState(days[0].value);
  const [time, setTime] = useState<string | null>(null);
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricing, setPricing] = useState({ originalPrice: "2500", discountedPrice: "1500", upiId: "" });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  useEffect(() => {
    if (!paidFlow) return;
    fetch("/api/public-content")
      .then((r) => r.json())
      .then((d) =>
        setPricing({
          originalPrice: d.premiumOriginalPrice || "2500",
          discountedPrice: d.premiumDiscountedPrice || "1500",
          upiId: d.premiumUpiId || "",
        })
      )
      .catch(() => {});
  }, [paidFlow]);


  useEffect(() => {
    fetch(`/api/appointments/availability?dietitianId=${encodeURIComponent(dietitianId)}&date=${date}`)
      .then((r) => r.json())
      .then((d) => setTakenTimes(d.takenTimes || []))
      .catch(() => setTakenTimes([]));
    setTime(null);
  }, [date, dietitianId]);

  async function confirmBooking() {
    if (!time) return;
    setBooking(true);
    setError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dietitianId, dietitianName, date, time }),
    });
    const data = await res.json();
    setBooking(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 14, padding: 16, marginTop: 18 }}>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: ".92rem" }}>✓ Appointment {paidFlow ? "requested" : "booked"}</p>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: ".85rem", marginTop: 4 }}>
          {new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at {time} with {dietitianName}
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <p style={{ fontSize: ".8rem", fontWeight: 700, color: "rgba(255,255,255,.8)", marginBottom: 8 }}>Pick a date</p>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {days.map((d) => (
          <span
            key={d.value}
            onClick={() => setDate(d.value)}
            style={{
              flex: "none", padding: "8px 14px", borderRadius: 100, fontSize: ".78rem", fontWeight: 600, cursor: "pointer",
              background: date === d.value ? "var(--mint)" : "rgba(255,255,255,.1)",
              color: date === d.value ? "var(--dark)" : "#fff",
            }}
          >
            {d.label}
          </span>
        ))}
      </div>

      <p style={{ fontSize: ".8rem", fontWeight: 700, color: "rgba(255,255,255,.8)", margin: "16px 0 8px" }}>Pick a time</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TIMES.map((t) => {
          const isTaken = takenTimes.includes(t);
          return (
            <span
              key={t}
              onClick={() => !isTaken && setTime(t)}
              style={{
                padding: "8px 14px", borderRadius: 100, fontSize: ".78rem", fontWeight: 600,
                cursor: isTaken ? "not-allowed" : "pointer",
                opacity: isTaken ? 0.35 : 1,
                background: time === t ? "var(--mint)" : "rgba(255,255,255,.1)",
                color: time === t ? "var(--dark)" : "#fff",
                textDecoration: isTaken ? "line-through" : "none",
              }}
            >
              {t}
            </span>
          );
        })}
      </div>

      {error && <p style={{ color: "#FFB4A0", fontSize: ".82rem", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 18 }}>
        {loggedIn === false ? (
          <button className="pill pill-primary" style={{ background: "var(--mint)", color: "var(--dark)" }} onClick={() => open("signup")}>
            Log in to book
          </button>
        ) : (
          <button
            className="pill pill-primary"
            style={{ background: "var(--mint)", color: "var(--dark)", opacity: time ? 1 : 0.5 }}
            disabled={!time || booking}
            onClick={() => (paidFlow ? setShowPricing(true) : confirmBooking())}
          >
            {booking ? "Booking…" : time ? (paidFlow ? `Continue with ${time}` : `Confirm ${time}`) : "Select a time"}
          </button>
        )}
      </div>

      {showPricing && time && (
        <PremiumConsultModal
          originalPrice={pricing.originalPrice}
          discountedPrice={pricing.discountedPrice}
          upiId={pricing.upiId}
          planSummary={`Consultation${conditionLabel ? ` for ${conditionLabel}` : ""} with ${dietitianName}`}
          prefillName={prefillName}
          prefillPhone={prefillPhone}
          booking={{ dietitianId, dietitianName, date, time }}
          onBooked={() => setConfirmed(true)}
          onClose={() => setShowPricing(false)}
        />
      )}
    </div>
  );
}
