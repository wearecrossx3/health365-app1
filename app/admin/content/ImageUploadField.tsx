"use client";

import { useRef, useState } from "react";

export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    onChange(data.url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="field">
      <label>{label} {hint && <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— {hint}</span>}</label>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed var(--line)", borderRadius: 14, padding: 18, textAlign: "center",
          cursor: "pointer", background: "#fafafa", marginBottom: 10,
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: 0 }}>
          {uploading ? "Uploading…" : "Click to choose a photo, or drag one here"}
        </p>
      </div>

      {error && <p style={{ color: "var(--terracotta)", fontSize: ".82rem", marginBottom: 10 }}>{error}</p>}

      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="or paste an image URL" />

      {value && (
        <div style={{ borderRadius: 12, overflow: "hidden", marginTop: 10, aspectRatio: "16/9", maxWidth: 280 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
    </div>
  );
}
