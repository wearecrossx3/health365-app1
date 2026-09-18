"use client";

import { useEffect, useState } from "react";

interface MediaFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGrid() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1800);
    });
  }

  async function handleDelete(url: string) {
    if (!confirm("Delete this image? This can't be undone.")) return;
    setDeletingUrl(url);
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setFiles((f) => f.filter((file) => file.url !== url));
    setDeletingUrl(null);
  }

  if (loading) return <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>Loading…</p>;

  if (files.length === 0) {
    return (
      <div className="empty-state">
        <h3>No images uploaded yet</h3>
        <p>Images you upload from the content editor (hero photo, Dr. Astha's photo, logo) will show up here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {files.map((file) => (
        <div key={file.url} className="panel" style={{ padding: 12 }}>
          <div style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", background: "var(--paper)", marginBottom: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={file.pathname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginBottom: 8 }}>
            {formatSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => copyUrl(file.url)}
              className="pill pill-outline"
              style={{ flex: 1, padding: "7px 10px", fontSize: ".74rem" }}
            >
              {copiedUrl === file.url ? "Copied ✓" : "Copy URL"}
            </button>
            <button
              onClick={() => handleDelete(file.url)}
              disabled={deletingUrl === file.url}
              className="pill pill-outline"
              style={{ padding: "7px 10px", fontSize: ".74rem", color: "var(--terracotta)", borderColor: "var(--terracotta)" }}
            >
              {deletingUrl === file.url ? "…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
