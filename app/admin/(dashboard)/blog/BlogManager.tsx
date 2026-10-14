"use client";

import { useState } from "react";
import ImageUploadField from "../content/ImageUploadField";
import type { BlogPost, BlogBlock, BlogBlockType } from "@/lib/blog";

const PALETTE = ["#4EAA67", "#287379", "#F6961D", "#9997C9", "#CBDB3D", "#E5394F"];
const small = { fontWeight: 400, color: "var(--ink-soft)" } as const;
const BLOCK_LABEL: Record<BlogBlockType, string> = { p: "Paragraph", h: "Heading", list: "Bullet list", tip: "Try-this tip", quote: "Dietitian's note", img: "Image" };

// Same structure as the app's "Small choices, better habits" cards.
const TEMPLATE: BlogBlock[] = [
  { type: "p", text: "One small change, explained simply — and how to fit it into a normal Indian day." },
  { type: "h", text: "Why it helps" },
  { type: "p", text: "Explain the reason in 2–3 short sentences. Keep it practical and kind — no fear, no jargon." },
  { type: "h", text: "How to start" },
  { type: "list", text: "", items: ["Step one — the smallest possible version", "Step two — where it fits in your day", "Step three — how to keep it going"] },
  { type: "tip", text: "Try this today: one specific, doable action the reader can take before dinner." },
  { type: "quote", text: "A short, warm note from the dietitian — the 'why this matters' in one line." },
];

type Draft = Partial<BlogPost> & { oldSlug?: string };

const blank = (useTemplate: boolean): Draft => ({
  title: "", slug: "", excerpt: "", tag: "Habit", coverUrl: "", color: "#4EAA67", emoji: "🌿", author: "Health365 Nutrition Team",
  blocks: useTemplate ? structuredClone(TEMPLATE) : [{ type: "p", text: "" }], published: false, showInApp: true, featured: false,
});

export default function BlogManager({ initial }: { initial: BlogPost[] }) {
  const [list, setList] = useState(initial);
  const [d, setD] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...(x || {}), ...p }));
  const setBlock = (i: number, p: Partial<BlogBlock>) => set({ blocks: (d?.blocks || []).map((b, k) => (k === i ? { ...b, ...p } : b)) });
  const move = (i: number, dir: number) => {
    const b = [...(d?.blocks || [])];
    const j = i + dir;
    if (j < 0 || j >= b.length) return;
    [b[i], b[j]] = [b[j], b[i]];
    set({ blocks: b });
  };

  async function save(publish?: boolean) {
    if (!d) return;
    setSaving(true); setError(null);
    const body = { ...d, published: publish ?? d.published };
    const res = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const r = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(r.error || "Couldn't save.");
    setList((l) => [r.post, ...l.filter((p) => p.slug !== d.oldSlug && p.slug !== r.post.slug)]);
    setD({ ...r.post, oldSlug: r.post.slug });
  }
  async function remove(p: BlogPost) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    setList((l) => l.filter((x) => x.slug !== p.slug));
    await fetch("/api/admin/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: p.slug }) });
  }

  if (d) {
    return (
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button onClick={() => setD(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#287379", fontWeight: 700, cursor: "pointer", padding: 0 }}>← All posts</button>
        <div className="field" style={{ marginBottom: 0 }}><label>Title</label><input value={d.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="Start lunch with a bowl of salad" /></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Short summary <span style={small}>— shown on cards</span></label><textarea rows={2} maxLength={300} value={d.excerpt} onChange={(e) => set({ excerpt: e.target.value })} /></div>
        <div className="admin-grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}><label>Tag</label><input value={d.tag} maxLength={20} onChange={(e) => set({ tag: e.target.value })} placeholder="Habit, Seeds, Move, Kitchen…" /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Emoji <span style={small}>— used when there&apos;s no photo</span></label><input value={d.emoji} maxLength={8} onChange={(e) => set({ emoji: e.target.value })} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Link <span style={small}>— auto from title if empty</span></label><input value={d.slug} maxLength={80} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="start-lunch-with-salad" /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Author</label><input value={d.author} maxLength={60} onChange={(e) => set({ author: e.target.value })} /></div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Card colour</p>
          <div style={{ display: "flex", gap: 8 }}>{PALETTE.map((c) => <button type="button" key={c} onClick={() => set({ color: c })} style={{ width: 30, height: 30, borderRadius: 999, background: c, border: d.color === c ? "3px solid #1F2B2C" : "2px solid #fff", boxShadow: "0 0 0 1px var(--line)", cursor: "pointer" }} />)}</div>
        </div>
        <ImageUploadField label="Cover photo" hint="optional" value={d.coverUrl || ""} onChange={(u) => set({ coverUrl: u })} />

        <h3 style={{ fontSize: "1rem", marginTop: 6 }}>Article</h3>
        {(d.blocks || []).map((b, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, background: b.type === "tip" ? "#F4F8DF" : b.type === "quote" ? "#EFEFF8" : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <select value={b.type} onChange={(e) => setBlock(i, { type: e.target.value as BlogBlockType, items: e.target.value === "list" ? b.items || [""] : b.items })} style={{ fontSize: ".8rem", padding: "4px 8px", borderRadius: 8 }}>
                {Object.entries(BLOCK_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <div style={{ display: "flex", gap: 10, fontSize: ".8rem" }}>
                <button type="button" onClick={() => move(i, -1)} style={{ background: "none", border: "none", cursor: "pointer" }}>↑</button>
                <button type="button" onClick={() => move(i, 1)} style={{ background: "none", border: "none", cursor: "pointer" }}>↓</button>
                <button type="button" onClick={() => set({ blocks: (d.blocks || []).filter((_, k) => k !== i) })} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer" }}>✕</button>
              </div>
            </div>
            {b.type === "list" ? (
              <textarea rows={Math.max(3, (b.items || []).length + 1)} value={(b.items || []).join("\n")} onChange={(e) => setBlock(i, { items: e.target.value.split("\n") })} placeholder="One point per line" style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 10, fontSize: ".9rem" }} />
            ) : b.type === "img" ? (
              <>
                <ImageUploadField label="Image" value={b.url || ""} onChange={(u) => setBlock(i, { url: u })} />
                <input value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} placeholder="Caption (optional)" style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 10 }} />
              </>
            ) : (
              <textarea rows={b.type === "h" ? 1 : 3} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 10, fontSize: b.type === "h" ? "1.05rem" : ".9rem", fontWeight: b.type === "h" ? 700 : 400 }} />
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(BLOCK_LABEL) as BlogBlockType[]).map((t) => (
            <button type="button" key={t} className="pill" style={{ fontSize: ".78rem", padding: "7px 12px" }} onClick={() => set({ blocks: [...(d.blocks || []), { type: t, text: "", items: t === "list" ? [""] : undefined }] })}>+ {BLOCK_LABEL[t]}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: ".88rem" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={!!d.showInApp} onChange={(e) => set({ showInApp: e.target.checked })} />Show in the app</label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={!!d.featured} onChange={(e) => set({ featured: e.target.checked })} />Featured (shown first)</label>
        </div>
        {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="pill pill-primary" disabled={saving} onClick={() => save(true)}>{saving ? "Saving…" : d.published ? "Save & keep published" : "Publish"}</button>
          <button className="pill" disabled={saving} onClick={() => save(false)}>{d.published ? "Unpublish (save as draft)" : "Save draft"}</button>
          {d.oldSlug && d.published && <a href={`/blog/${d.oldSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: ".85rem", fontWeight: 700, color: "#287379" }}>View on site ↗</a>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="pill pill-primary" onClick={() => setD(blank(true))}>+ New post from template</button>
        <button className="pill" onClick={() => setD(blank(false))}>+ Blank post</button>
      </div>
      {list.map((p) => (
        <div key={p.slug} className="panel" style={{ display: "flex", gap: 14, alignItems: "center", padding: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: p.color, display: "grid", placeItems: "center", fontSize: "1.5rem", flex: "none", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.coverUrl ? <img src={p.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700 }}>{p.title}</p>
            <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 2 }}>
              <span style={{ color: p.published ? "#2E7D4F" : "#B4690E", fontWeight: 700 }}>● {p.published ? "Published" : "Draft"}</span> · {p.tag} · {p.readMins} min read{p.showInApp ? " · in app" : ""} · /{p.slug}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flex: "none" }}>
            <button onClick={() => setD({ ...p, oldSlug: p.slug })} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>Edit</button>
            <button onClick={() => remove(p)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, fontSize: ".8rem", cursor: "pointer" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
