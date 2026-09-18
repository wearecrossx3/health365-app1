"use client";

import { useEffect, useState, useRef } from "react";

interface Event {
  type: "consultation" | "appointment";
  goal: string | null;
  createdAt: string;
}

const VISIBLE_MS = 6000; // how long each toast stays on screen
const FIRST_DELAY_MS = 15000; // wait before the very first one shows
const GAP_MIN_MS = 45000; // shortest gap between toasts
const GAP_MAX_MS = 90000; // longest gap between toasts

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function messageFor(e: Event): string {
  if (e.type === "consultation") {
    return e.goal ? `A consultation was started — goal: ${e.goal}` : "A new consultation was started";
  }
  return "A new appointment was booked";
}

export default function ActivityToast() {
  const [events, setEvents] = useState<Event[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/recent-activity")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    function showOnce() {
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        const gap = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
        timerRef.current = setTimeout(() => {
          setIndex((i) => (i + 1) % events.length);
          showOnce();
        }, gap);
      }, VISIBLE_MS);
    }

    timerRef.current = setTimeout(showOnce, FIRST_DELAY_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  if (events.length === 0) return null;
  const current = events[index];

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 85, maxWidth: 300,
        background: "#fff", borderRadius: 16, padding: "14px 18px",
        boxShadow: "0 20px 40px -18px rgba(20,24,18,.3)", border: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 12,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity .5s ease, transform .5s ease", pointerEvents: visible ? "auto" : "none",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", flex: "none" }} />
      <div>
        <p style={{ fontSize: ".82rem", color: "var(--ink)", fontWeight: 600, margin: 0 }}>{messageFor(current)}</p>
        <p style={{ fontSize: ".74rem", color: "var(--ink-soft)", margin: "2px 0 0" }}>{relativeTime(current.createdAt)}</p>
      </div>
    </div>
  );
}
