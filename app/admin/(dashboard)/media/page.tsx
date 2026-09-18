import MediaGrid from "./MediaGrid";

export default function MediaLibraryPage() {
  return (
    <main style={{ padding: "48px 32px" }}>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow">Admin</span>
          <h1 style={{ fontSize: "2rem" }}>Media Library</h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: ".95rem" }}>
            Every image uploaded from the content editor lands here. Copy a link to reuse an
            image anywhere, or remove ones you don't need.
          </p>
        </div>
        <MediaGrid />
      </div>
    </main>
  );
}
