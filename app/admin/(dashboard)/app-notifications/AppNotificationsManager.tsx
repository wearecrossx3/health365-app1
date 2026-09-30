"use client";

import { useState } from "react";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
  sentBy: string;
}

const AUDIENCE_OPTIONS: [string, string][] = [
  ["all", "Everyone"],
  ["account", "Users with an account"],
  ["guest", "Users without an account"],
  ["diabetes", "Diabetes plan"],
  ["pcos", "PCOS plan"],
  ["thyroid", "Thyroid plan"],
  ["weight", "Weight management plan"],
  ["cholesterol", "Cholesterol plan"],
  ["digestive", "Digestive health plan"],
  ["oncology", "Cancer care plan"],
];
const audienceLabel = (a: string) => AUDIENCE_OPTIONS.find(([k]) => k === a)?.[1] || a;

export default function AppNotificationsManager({ initial }: { initial: AppNotification[] }) {
  const [list, setList] = useState<AppNotification[]>(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Send "${title}" to: ${audienceLabel(audience)}?`)) return;
    setSending(true);
    setError(null);
    setSent(false);
    const res = await fetch("/api/admin/app-notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, audience }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Couldn't send.");
      return;
    }
    setList((l) => [data.notification, ...l]);
    setTitle("");
    setBody("");
    setSent(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this notification? Phones that haven't received it yet won't get it. Phones that already showed it keep it.")) return;
    setList((l) => l.filter((n) => n.id !== id));
    await fetch("/api/admin/app-notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form onSubmit={handleSend} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: "1.05rem" }}>New notification</h2>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Title <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— {title.length}/65</span></label>
          <input value={title} maxLength={65} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. New Navratri fasting plan 🪔" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Message <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— {body.length}/240</span></label>
          <textarea rows={3} maxLength={240} value={body} onChange={(e) => setBody(e.target.value)} required placeholder="e.g. Fasting-friendly meals for all 9 days are now in the app. Open Health365 to see them." />
        </div>
        <div className="field" style={{ maxWidth: 320, marginBottom: 0 }}>
          <label>Send to</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>

        {(title || body) && (
          <div>
            <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Preview</p>
            <div style={{ background: "#1F2B2C", color: "#fff", borderRadius: 16, padding: "12px 14px", maxWidth: 380, display: "flex", gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "#4EAA67", flex: "none", display: "grid", placeItems: "center", fontSize: 12 }}>🍃</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: ".72rem", opacity: 0.6 }}>Health365 · now</p>
                <p style={{ fontWeight: 600, fontSize: ".9rem" }}>{title || "Title"}</p>
                <p style={{ fontSize: ".85rem", opacity: 0.85 }}>{body || "Message"}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
        {sent && <p style={{ color: "#2E7D4F", fontSize: ".85rem", fontWeight: 600 }}>Sent ✓ — phones will show it within about 30 minutes.</p>}
        <div>
          <button type="submit" disabled={sending} className="pill pill-primary">
            {sending ? "Sending…" : "Send notification"}
          </button>
        </div>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: "1.05rem" }}>Sent</h2>
        {list.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>Nothing sent yet.</p>}
        {list.map((n) => (
          <div key={n.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 20 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{n.title}</p>
              <p style={{ fontSize: ".88rem", marginTop: 4, color: "var(--ink-soft)", maxWidth: "55ch" }}>{n.body}</p>
              <p style={{ fontSize: ".76rem", marginTop: 8, color: "var(--ink-soft)" }}>
                {audienceLabel(n.audience)} · {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {n.sentBy}
              </p>
            </div>
            <button onClick={() => handleDelete(n.id)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".78rem", fontWeight: 600, cursor: "pointer", flex: "none" }}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
