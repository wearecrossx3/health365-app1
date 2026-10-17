// Admin pages: keep the sidebar/header in place and show a quiet,
// delayed spinner only inside the content area while data loads.
export default function AdminLoading() {
  return (
    <div className="h365-loading" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="h365-spinner" />
    </div>
  );
}
