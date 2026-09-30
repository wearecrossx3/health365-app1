"use client";

import { useState } from "react";
import { Coupon, applyCoupon, normalizeCode } from "@/lib/couponMath";

const small = { fontWeight: 400, color: "var(--ink-soft)" } as const;

export default function CouponsManager({ initial, price }: { initial: Coupon[]; price: number }) {
  const [list, setList] = useState<Coupon[]>(initial);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [onePerUser, setOnePerUser] = useState(true);
  const [expiresOn, setExpiresOn] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft: Coupon = {
    code: normalizeCode(code), type, value: Number(value) || 0, active: true, maxUses: 0, used: 0,
    onePerUser: false, usedBy: [], expiresOn: "", note: "", createdAt: "",
  };
  const preview = price && Number(value) > 0 ? applyCoupon(draft, price) : null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value: Number(value), maxUses: Number(maxUses) || 0, onePerUser, expiresOn, note }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      return;
    }
    setList((l) => [data.coupon, ...l]);
    setCode(""); setValue(""); setMaxUses(""); setExpiresOn(""); setNote("");
  }

  async function toggle(c: Coupon) {
    setList((l) => l.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)));
    await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c.code, active: !c.active }) });
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}? People won't be able to use it any more.`)) return;
    setList((l) => l.filter((x) => x.code !== c.code));
    await fetch("/api/admin/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c.code }) });
  }

  const status = (c: Coupon) => {
    const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    if (!c.active) return ["Off", "#8A8F98"];
    if (c.expiresOn && today > c.expiresOn) return ["Expired", "#A51F31"];
    if (c.maxUses > 0 && c.used >= c.maxUses) return ["Used up", "#A51F31"];
    return ["Active", "#2E7D4F"];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form onSubmit={create} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: "1.05rem" }}>New coupon</h2>
        <div className="admin-grid-2" style={{ gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Code</label>
            <input value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} required placeholder="e.g. NAVRATRI20" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Discount</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={type} onChange={(e) => setType(e.target.value as "percent" | "flat")} style={{ maxWidth: 120 }}>
                <option value="percent">% off</option>
                <option value="flat">₹ off</option>
              </select>
              <input type="number" min={1} max={type === "percent" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} required placeholder={type === "percent" ? "20" : "300"} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Total uses <span style={small}>— empty = unlimited</span></label>
            <input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="e.g. 50" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Last valid day <span style={small}>— empty = never expires</span></label>
            <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Note <span style={small}>— only admins see this</span></label>
          <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Instagram giveaway, Diwali offer" />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: ".9rem" }}>
          <input type="checkbox" checked={onePerUser} onChange={(e) => setOnePerUser(e.target.checked)} />
          Each person can use it only once
        </label>
        {preview && preview.ok && (
          <p style={{ fontSize: ".9rem", background: "#E6F3E9", color: "#256B3C", padding: "10px 14px", borderRadius: 12 }}>
            With this code, the consultation costs <b>₹{preview.price}</b> instead of ₹{preview.original}
            {preview.price === 0 ? " — it will be booked free, no payment step." : "."}
          </p>
        )}
        {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
        <div>
          <button type="submit" disabled={saving} className="pill pill-primary">{saving ? "Saving…" : "Create coupon"}</button>
        </div>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: "1.05rem" }}>Your coupons</h2>
        {list.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No coupons yet.</p>}
        {list.map((c) => {
          const [st, col] = status(c);
          return (
            <div key={c.code} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 20 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: ".04em" }}>
                  {c.code} <span style={{ fontSize: ".75rem", fontWeight: 700, color: col, marginLeft: 6 }}>● {st}</span>
                </p>
                <p style={{ fontSize: ".88rem", marginTop: 4 }}>
                  {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                  {price ? ` · pays ₹${Math.max(0, c.type === "percent" ? price - Math.round((price * c.value) / 100) : price - c.value)}` : ""}
                </p>
                <p style={{ fontSize: ".78rem", marginTop: 6, color: "var(--ink-soft)" }}>
                  Used {c.used}{c.maxUses ? ` / ${c.maxUses}` : ""} · {c.onePerUser ? "once per person" : "reusable"} · {c.expiresOn ? `valid till ${c.expiresOn}` : "no expiry"}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={c.active} onChange={() => toggle(c)} />
                  <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{c.active ? "On" : "Off"}</span>
                </label>
                <button onClick={() => remove(c)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".78rem", fontWeight: 600, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
