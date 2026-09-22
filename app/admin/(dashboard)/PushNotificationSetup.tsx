"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "prompt" | "denied" | "subscribed" | "error";

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setStatus("subscribed");
          return;
        }
        setStatus(Notification.permission === "denied" ? "denied" : "prompt");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  async function enable() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const { publicKey } = await fetch("/api/push/vapid-public-key").then((r) => r.json());
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }

  if (status !== "prompt") return null;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        background: "#0F1613", color: "#fff", padding: "12px 20px",
      }}
    >
      <span style={{ fontSize: ".86rem" }}>
        🔔 Turn on notifications to hear about new consultations and messages the moment they come in — on this
        device, even when this tab isn&apos;t open.
      </span>
      <button
        onClick={enable}
        className="pill pill-primary"
        style={{ padding: "8px 18px", fontSize: ".82rem", flexShrink: 0 }}
      >
        Enable notifications
      </button>
    </div>
  );
}
