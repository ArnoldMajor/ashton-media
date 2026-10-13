"use client";
import { useState } from "react";
import Image from "next/image";
import { PHOTO_QUALITY, REAL_PHOTOS } from "@/lib/photos";

interface Props {
  label?: string | null;
  ratio?: string;
  overlay?: boolean;
  photoIndex?: number;
  /** A specific photo to show instead of the stock one at `photoIndex`. */
  src?: string | null;
  /** Alt text. Defaults to `label`, or "Billboard" when there is no label. */
  alt?: string | null;
  /** The `sizes` hint for next/image. Defaults to half the viewport above 768px. */
  sizes?: string;
  /**
   * Preload this image in the document head: pass true for the one image that
   * is above the fold. Left unset, the image keeps the older rule of being
   * prioritised when it is stock photo 4.
   */
  preload?: boolean;
  fill?: boolean;
  className?: string;
}

const DEFAULT_SIZES = "(max-width: 768px) 100vw, 50vw";

export default function PhotoPlaceholder({
  label = null,
  ratio = "16/9",
  overlay = true,
  photoIndex = 0,
  src = null,
  alt = null,
  sizes = DEFAULT_SIZES,
  preload,
  fill = false,
  className = "",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const photoSrc = src || REAL_PHOTOS[photoIndex % REAL_PHOTOS.length];
  // next/image rejects `priority` and `preload` together, so it gets exactly one.
  const loadingHint = preload === undefined ? { priority: photoIndex === 4 } : { preload };

  return (
    <div
      className={`bg-card-alt overflow-hidden ${
        fill ? "absolute inset-0" : "w-full relative shrink-0"
      } ${className}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {!failed && (
        <Image
          src={photoSrc}
          alt={alt ?? (label || "Billboard")}
          fill
          sizes={sizes}
          quality={PHOTO_QUALITY}
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          {...loadingHint}
        />
      )}

      {(!loaded || failed) && (
        <svg viewBox="0 0 800 450" className="w-full h-full absolute inset-0" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id={`rg${photoIndex}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="var(--color-placeholder-start)" />
              <stop offset="100%" stopColor="var(--color-canvas)" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill={`url(#rg${photoIndex})`} />
          <rect x="0" y="270" width="800" height="180" fill="var(--color-raised)" />
          <rect x="230" y="70" width="340" height="180" rx="4" fill="var(--color-placeholder-shape)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          <rect x="242" y="82" width="316" height="156" fill="var(--color-placeholder-inner)" />
          <rect x="258" y="102" width="190" height="20" rx="3" fill="rgba(255,255,255,0.2)" />
          <rect x="258" y="130" width="130" height="12" rx="2" fill="rgba(255,255,255,0.1)" />
          <rect x="388" y="250" width="20" height="56" fill="var(--color-placeholder-shape)" />
        </svg>
      )}

      {overlay && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.6)_100%)]" />
      )}

      {label && (
        <div className="absolute bottom-3 left-3.5 right-3.5 wrap-break-word text-[12px] md:text-[10px] font-semibold tracking-[2px] uppercase text-white/55 z-1">
          {label}
        </div>
      )}
    </div>
  );
}
