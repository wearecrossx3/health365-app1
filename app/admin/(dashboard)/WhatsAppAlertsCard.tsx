"use client";

import { useEffect, useState } from "react";

type Phone = { phone: string; name: string; key: string };
type Health = { lastOk: string; lastError: { at: string; error: string } | null };

const BOT = "+34 611 01 16 37";
const ACTIVATE = "I allow callmebot to send me messages";
const fmt = (t: string) => new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

// Free WhatsApp alerts to the owner's own phone (CallMeBot).
export default function WhatsAppAlertsCard() {
  const [phones, setPhones] = useState<Phone[] | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", apikey: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    const r = await fetch("/api/admin/whatsapp-alerts", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setPhones(d.phones); setHealth(d.health);
  };
  useEffect(() => { load(); }, []);

  async function post(body: object) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/whatsapp-alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    await load();
    return { ok: r.ok, d };
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { ok, d } = await post({ action: "add", ...f });
    if (!ok) { setMsg({ ok: false, text: d.error || "Couldn't save." }); return; }
    setF({ name: "", phone: "", apikey: "" }); setOpen(false);
    setMsg(d.tested ? { ok: true, text: "Saved! Check WhatsApp — a “Health365 alerts are on” message was sent." } : { ok: false, text: `Saved, but the test didn't go through: ${d.error || "unknown"}. Check the number and key.` });
  }
  async function test() {
    const { d } = await post({ action: "test" });
    setMsg(d.sent ? { ok: true, text: "Sent! Check WhatsApp." } : { ok: false, text: d.error || "Couldn't send." });
  }

  if (!phones) return null;
  const on = phones.length > 0;
  const failing = on && health?.lastError && (!health.lastOk || health.lastError.at > health.lastOk);
  const badge: [string, string] = !on ? ["Not set up", "var(--ink-soft)"] : failing ? ["Errors", "var(--terracotta)"] : ["On", "#2E7D4F"];
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => setMsg({ ok: true, text: "Copied." })).catch(() => {});

  return (
    <div className="panel" style={{ marginBottom: 24, borderColor: failing ? "var(--terracotta)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "1.2rem" }}>WhatsApp alerts to me <span style={{ fontSize: ".8rem", color: "var(--ink-soft)", fontWeight: 500 }}>(free)</span></h2>
        <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "5px 11px", borderRadius: 100, color: "#fff", background: badge[1] }}>{badge[0]}</span>
      </div>
      <p className="text-sm" style={{ color: "var(--ink-soft)", marginTop: 8 }}>
        Get a WhatsApp on your own phone when someone joins, books, pays or sends a consultation. Only for you and your team — not for customers.
      </p>

      {phones.map((p) => (
        <div key={p.phone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--line)", marginTop: 8 }}>
          <span style={{ fontSize: ".9rem" }}>📱 {p.name ? <b>{p.name}</b> : null} +{p.phone} <span style={{ color: "var(--ink-soft)", fontSize: ".78rem" }}>key {p.key}</span></span>
          <button className="pill pill-outline" disabled={busy} onClick={() => post({ action: "remove", phone: p.phone })} style={{ padding: "4px 12px", fontSize: ".76rem" }}>Remove</button>
        </div>
      ))}
      {failing && health?.lastError && <p style={{ fontSize: ".8rem", color: "var(--terracotta)", marginTop: 6, overflowWrap: "anywhere" }}>Last error ({fmt(health.lastError.at)}): {health.lastError.error}</p>}
      {on && health?.lastOk && !failing && <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 6 }}>Last alert sent {fmt(health.lastOk)}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {!open && <button className="pill pill-primary" onClick={() => setOpen(true)} style={{ padding: "8px 16px", fontSize: ".82rem" }}>{on ? "+ Add another number" : "Set up"}</button>}
        {on && !open && <button className="pill pill-outline" disabled={busy} onClick={test} style={{ padding: "8px 16px", fontSize: ".82rem" }}>{busy ? "Sending…" : "Send test"}</button>}
      </div>

      {open && (
        <form onSubmit={add} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <ol style={{ paddingLeft: 22, fontSize: ".88rem", lineHeight: 1.7, listStyle: "decimal" }}>
            <li>Save <b>{BOT}</b> in your phone contacts (name it “CallMeBot”). <button type="button" onClick={() => copy(BOT.replace(/\s/g, ""))} className="pill pill-outline" style={{ padding: "1px 10px", fontSize: ".72rem" }}>Copy</button></li>
            <li>From <b>your</b> WhatsApp, send it exactly: <i>{ACTIVATE}</i> <button type="button" onClick={() => copy(ACTIVATE)} className="pill pill-outline" style={{ padding: "1px 10px", fontSize: ".72rem" }}>Copy</button></li>
            <li>It replies with your <b>API key</b> (a number). Paste it below with your WhatsApp number.</li>
          </ol>
          <p style={{ fontSize: ".76rem", color: "var(--ink-soft)", marginTop: -6 }}>No reply in 2 minutes? CallMeBot sometimes changes its number — check callmebot.com for the current one.</p>
          <div className="field"><label>Name (optional)</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="SJ" /></div>
          <div className="field"><label>Your WhatsApp number</label><input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98XXXXXXXX" required /></div>
          <div className="field"><label>API key from CallMeBot</label><input inputMode="numeric" value={f.apikey} onChange={(e) => setF({ ...f, apikey: e.target.value })} placeholder="1234567" required /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={busy} className="pill pill-primary" style={{ padding: "8px 18px", fontSize: ".85rem" }}>{busy ? "Saving…" : "Save & send test"}</button>
            <button type="button" onClick={() => setOpen(false)} className="pill pill-outline" style={{ padding: "8px 18px", fontSize: ".85rem" }}>Cancel</button>
          </div>
        </form>
      )}
      {msg && <p style={{ fontSize: ".85rem", color: msg.ok ? "#2E7D4F" : "var(--terracotta)", marginTop: 10, fontWeight: 600, overflowWrap: "anywhere" }}>{msg.text}</p>}
    </div>
  );
}
