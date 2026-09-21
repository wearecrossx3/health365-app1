"use client";

import { useState } from "react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  source: "contact_form" | "chat_widget";
  read: boolean;
  createdAt: string;
}

export default function MessagesManager({ initial }: { initial: ContactMessage[] }) {
  const [messages, setMessages] = useState<ContactMessage[]>(initial);

  async function toggleRead(m: ContactMessage) {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: !x.read } : x)));
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, read: !m.read }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    setMessages((list) => list.filter((m) => m.id !== id));
    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  if (messages.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No messages yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.map((m) => (
        <div
          key={m.id}
          className="panel"
          style={{ padding: 20, opacity: m.read ? 0.65 : 1, borderColor: m.read ? undefined : "var(--teal)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ fontWeight: 700, fontSize: ".95rem" }}>{m.name || "Website visitor"}</p>
                <span
                  style={{
                    fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em",
                    padding: "2px 8px", borderRadius: 100,
                    background: m.source === "chat_widget" ? "var(--sage)" : "var(--paper)",
                    color: "var(--ink-soft)",
                  }}
                >
                  {m.source === "chat_widget" ? "Chat" : "Contact form"}
                </span>
                {!m.read && (
                  <span style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--teal-deep)" }}>● New</span>
                )}
              </div>
              {m.email && <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 2 }}>{m.email}</p>}
              <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 2 }}>
                {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => toggleRead(m)} className="pill pill-outline" style={{ padding: "6px 14px", fontSize: ".78rem" }}>
                {m.read ? "Mark unread" : "Mark read"}
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".78rem", fontWeight: 600, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
          <p style={{ fontSize: ".88rem", marginTop: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}
