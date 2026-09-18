export default function Logo({
  variant = "dark",
  height = 26,
}: {
  variant?: "light" | "dark";
  height?: number;
}) {
  const src = variant === "light" ? "/logo-light.svg" : "/logo-dark.svg";
  // Plain <img> (not next/image) since this is a small, already-optimized
  // vector logo — no responsive/lazy-loading machinery needed for it.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Health365" style={{ height, width: "auto", display: "block" }} />;
}
