export default function Logo({
  variant = "dark",
  height = 26,
  customUrl,
}: {
  variant?: "light" | "dark";
  height?: number;
  customUrl?: string;
}) {
  if (customUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={customUrl} alt="Health365" style={{ height, width: "auto", display: "block" }} />;
  }
  const src = variant === "light" ? "/logo-light.svg" : "/logo-dark.svg";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Health365" style={{ height, width: "auto", display: "block" }} />;
}
