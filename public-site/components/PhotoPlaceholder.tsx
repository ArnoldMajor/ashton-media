"use client";
import { useState } from "react";
import Image from "next/image";
import { REAL_PHOTOS } from "@/lib/data";

// Why next/image instead of <img>?
// - Automatic WebP/AVIF conversion
// - Lazy loading built in
// - Prevents layout shift (reserves space)
// - Responsive sizing handled for you

interface Props {
  label?: string | null;
  ratio?: string;
  overlay?: boolean;
  photoIndex?: number;
  fill?: boolean;
  className?: string;
}

export default function PhotoPlaceholder({
  label = null,
  ratio = "16/9",
  overlay = true,
  photoIndex = 0,
  fill = false,
  className = "",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = REAL_PHOTOS[photoIndex % REAL_PHOTOS.length];

  const containerStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, background: "var(--bg-card-alt)", overflow: "hidden" }
    : { width: "100%", aspectRatio: ratio, position: "relative", overflow: "hidden", background: "var(--bg-card-alt)", flexShrink: 0 };

  return (
    <div style={containerStyle} className={className}>
      {!failed && (
        // next/image with fill=true makes the image fill the parent (which needs position:relative)
        <Image
          src={src}
          alt={label || "Billboard"}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.5s" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          priority={photoIndex === 4} // prioritize hero image
        />
      )}

      {/* Fallback SVG shown while image loads or if it errors */}
      {(!loaded || failed) && (
        <svg viewBox="0 0 800 450" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id={`rg${photoIndex}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="var(--bg-placeholder-start)" />
              <stop offset="100%" stopColor="var(--bg)" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill={`url(#rg${photoIndex})`} />
          <rect x="0" y="270" width="800" height="180" fill="var(--bg-raised)" />
          <rect x="230" y="70" width="340" height="180" rx="4" fill="var(--bg-placeholder-shape)" stroke="var(--white-soft)" strokeWidth="1.5" />
          <rect x="242" y="82" width="316" height="156" fill="var(--bg-placeholder-inner)" />
          <rect x="258" y="102" width="190" height="20" rx="3" fill="var(--white-dim)" />
          <rect x="258" y="130" width="130" height="12" rx="2" fill="var(--white-soft)" />
          <rect x="388" y="250" width="20" height="56" fill="var(--bg-placeholder-shape)" />
        </svg>
      )}

      {overlay && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--black-hint) 0%, var(--black-heavy) 100%)" }} />
      )}

      {label && (
        <div style={{ position: "absolute", bottom: "12px", left: "14px", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", color: "var(--white-medium)", textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif", zIndex: 1 }}>
          {label}
        </div>
      )}
    </div>
  );
}
