import Link from "next/link";

export default function OncologyBanner({
  imageUrl,
  title,
  subtitle,
  buttonText,
  buttonHref,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
}) {
  return (
    <div className="oncology-banner">
      <div
        className={`photo${imageUrl ? "" : " ph-rose grain"}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="oncology-banner-text">
        <span className="luma-eyebrow">Oncology Care</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <Link href={buttonHref} className="pill pill-primary">{buttonText}</Link>
      </div>
    </div>
  );
}
