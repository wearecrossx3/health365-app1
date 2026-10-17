// Shown only while a page is still loading. The spinner waits a moment
// before fading in, so fast page loads don't flash a blank screen + spinner.
export default function Loading() {
  return (
    <div className="h365-loading" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="h365-spinner" />
    </div>
  );
}
