"use client";

import { useState } from "react";

export default function LazyPhoto({
  src,
  placeholderClass,
  alt = "",
  style,
  icon,
}: {
  src?: string;
  placeholderClass: string;
  alt?: string;
  style?: React.CSSProperties;
  icon?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`photo ${placeholderClass} grain`} style={{ position: "relative", overflow: "hidden", ...style }}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: loaded ? 1 : 0, transition: "opacity .5s ease",
          }}
        />
      )}
      {icon && (
        <span
          style={{
            position: "absolute", top: 12, left: 12, width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.05rem", boxShadow: "0 4px 10px -4px rgba(0,0,0,.25)",
          }}
        >
          {icon}
        </span>
      )}
    </div>
  );
}
