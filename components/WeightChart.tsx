// Small weight-progress chart from the weights the client logs in the app.
export type WeightPoint = { d: string; kg: number };

export default function WeightChart({ points, height = 120 }: { points: WeightPoint[]; height?: number }) {
  const pts = points.filter((p) => p && Number(p.kg) > 0).slice(-30);
  if (pts.length === 0) return <p style={{ fontSize: ".85rem", color: "#6B7672", margin: 0 }}>No weight logged in the app yet.</p>;
  const first = pts[0], last = pts[pts.length - 1];
  const diff = Math.round((last.kg - first.kg) * 10) / 10;
  const W = 320, H = height, P = 14;
  const min = Math.min(...pts.map((p) => p.kg)), max = Math.max(...pts.map((p) => p.kg));
  const span = Math.max(1, max - min);
  const x = (i: number) => P + (pts.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (pts.length - 1));
  const y = (kg: number) => P + ((max - kg) * (H - 2 * P)) / span;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", fontSize: ".85rem" }}>
        <span><b style={{ fontSize: "1.1rem" }}>{last.kg} kg</b> <span style={{ color: "#6B7672" }}>on {fmt(last.d)}</span></span>
        {pts.length > 1 && <span style={{ fontWeight: 700, color: diff < 0 ? "#2E7D4F" : diff > 0 ? "#B4442A" : "#6B7672" }}>{diff > 0 ? "+" : ""}{diff} kg since {fmt(first.d)}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Weight from ${first.kg} kg to ${last.kg} kg`} style={{ marginTop: 6, display: "block" }}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#E4E0D8" strokeWidth="1" />
        <path d={path} fill="none" stroke="#287379" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.kg)} r={i === pts.length - 1 ? 4 : 2.5} fill="#287379" />)}
        <text x={P} y={y(max) - 4 < 10 ? 10 : y(max) - 4} fontSize="10" fill="#6B7672">{max} kg</text>
        {max !== min && <text x={P} y={H - P - 4} fontSize="10" fill="#6B7672">{min} kg</text>}
      </svg>
      <p style={{ fontSize: ".75rem", color: "#6B7672", margin: "2px 0 0" }}>{pts.length} entr{pts.length === 1 ? "y" : "ies"} logged in the app</p>
    </div>
  );
}
