"use client";

import { useEffect, useState } from "react";

interface Event {
  type: "consultation" | "appointment";
  goal: string | null;
  createdAt: string;
}

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

  useEffect(() => {
    fetch("/api/recent-activity")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const showTimer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(showTimer);
  }, [events]);

  useEffect(() => {
    if (!visible || events.length === 0) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % events.length);
        setVisible(true);
      }, 400);
    }, 7000);
    return () => clearInterval(cycle);
  }, [visible, events.length]);

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
        transition: "opacity .4s ease, transform .4s ease", pointerEvents: visible ? "auto" : "none",
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
