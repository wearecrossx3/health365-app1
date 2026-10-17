"use client";

import { useEffect, useState } from "react";

type Bridge = {
  status?: () => string;
  checkNow?: () => void;
  openNotificationSettings?: () => void;
  openBatterySettings?: () => void;
};
type Status = { app: boolean; notifications: boolean; battery: boolean; loggedIn: boolean };

const bridge = (): Bridge | null => (typeof window !== "undefined" ? ((window as unknown as { AdminApp?: Bridge }).AdminApp ?? null) : null);

// Shows whether this phone (Admin app) is ready to receive alerts, with
// one-tap fixes, and a "Send test notification" button.
export default function AdminAlertsCard() {
  const [st, setSt] = useState<Status | null>(null);
  const [inApp, setInApp] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const read = () => {
    const b = bridge();
    if (!b) return;
    setInApp(true);
    try { if (b.status) setSt(JSON.parse(b.status())); } catch { /* older app */ }
  };
  useEffect(() => {
    read();
    const t = setInterval(read, 3000); // refresh after coming back from settings
    return () => clearInterval(t);
  }, []);

  async function test() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/test-alert", { method: "POST" });
    setBusy(false);
    if (!r.ok) { setMsg("Couldn't send — please try again."); return; }
    const b = bridge();
    if (b?.checkNow) {
      setTimeout(() => b.checkNow && b.checkNow(), 800);
      setMsg("Sent! A “🔔 Test alert” notification should pop up on this phone in a few seconds.");
    } else {
      setMsg("Sent! Phones with the Health365 Admin app will show it within about 10 minutes.");
    }
  }

  const row = (ok: boolean, label: string, fix?: () => void, fixLabel?: string) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
      <span style={{ fontSize: ".88rem" }}>{ok ? "✅" : "⚠️"} {label}</span>
      {!ok && fix && <button className="pill pill-outline" onClick={fix} style={{ padding: "5px 12px", fontSize: ".78rem" }}>{fixLabel}</button>}
    </div>
  );

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Admin app alerts</h2>
        <button className="pill pill-primary" disabled={busy} onClick={test} style={{ padding: "8px 16px", fontSize: ".82rem" }}>
          {busy ? "Sending…" : "🔔 Send test notification"}
        </button>
      </div>
      {inApp && st && (
        <div style={{ marginTop: 10 }}>
          {row(st.notifications, st.notifications ? "Notifications are on" : "Notifications are off on this phone", () => bridge()?.openNotificationSettings?.(), "Turn on")}
          {row(st.battery, st.battery ? "Battery saver won’t block alerts" : "Battery saver may delay alerts", () => bridge()?.openBatterySettings?.(), "Fix")}
        </div>
      )}
      {inApp && !st && (
        <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginTop: 8 }}>Update the Health365 Admin app to see this phone&apos;s alert status here.</p>
      )}
      {!inApp && (
        <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginTop: 8 }}>Open this page in the Health365 Admin app to check alerts on your phone.</p>
      )}
      {msg && <p style={{ fontSize: ".85rem", color: "#2E7D4F", marginTop: 10, fontWeight: 600 }}>{msg}</p>}
    </div>
  );
}
