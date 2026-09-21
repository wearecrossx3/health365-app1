"use client";

import { useState } from "react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  photoUrl: string;
  published: boolean;
  createdAt: string;
}

export default function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initial);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, quote, rating, published: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      return;
    }
    setTestimonials((t) => [data.testimonial, ...t]);
    setName(""); setRole(""); setQuote(""); setRating(5);
  }

  async function togglePublished(t: Testimonial) {
    setTestimonials((list) => list.map((x) => (x.id === t.id ? { ...x, published: !x.published } : x)));
    await fetch("/api/admin/testimonials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, published: !t.published }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    setTestimonials((list) => list.filter((t) => t.id !== id));
    await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form onSubmit={handleAdd} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: "1.05rem" }}>Add a testimonial</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Priya S." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Context <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional</span></label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Lost 8kg in 6 months" />
          </div>
        </div>
        <div className="field">
          <label>Quote</label>
          <textarea rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} required placeholder="What they said" />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
        <div>
          <button type="submit" disabled={saving} className="pill pill-primary">
            {saving ? "Adding…" : "Add testimonial"}
          </button>
        </div>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {testimonials.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No testimonials yet.</p>}
        {testimonials.map((t) => (
          <div key={t.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 20 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: ".92rem" }}>{t.name} {t.role && <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— {t.role}</span>}</p>
              <p style={{ fontSize: ".88rem", marginTop: 6, color: "var(--ink-soft)", maxWidth: "50ch" }}>&quot;{t.quote}&quot;</p>
              <p style={{ fontSize: ".78rem", marginTop: 6 }}>{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={t.published} onChange={() => togglePublished(t)} />
                <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{t.published ? "Published" : "Hidden"}</span>
              </label>
              <button onClick={() => handleDelete(t.id)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".78rem", fontWeight: 600, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
