import type { CSSProperties } from "react";
import Image from "next/image";
import { BRANDS, type Brand } from "@/lib/brands";

/** Scroll speed in px per second, whatever the number of brands. */
const SPEED = 40;

/** One half of the track is at least this wide at desktop sizing, so it always overfills the screen. */
const MIN_HALF_WIDTH = 2600;

/**
 * The two sizings, in px: below md and from md up. The classes further down
 * (h-7 md:h-9, px-4 md:px-7, p-1 md:p-1.5, text-[12px] md:text-[14px]) say
 * the same numbers. Change both together, or the speed drifts from SPEED.
 */
interface Sizing {
  /** Height of every item. */
  height: number;
  /** Widest a logo, or a tile, may be. */
  maxWidth: number;
  /** Padding on each side of an item. Two neighbours sit 2 × this apart. */
  padX: number;
  /** Padding inside a white tile. */
  tilePad: number;
  /** Font size of a brand that has no logo yet. */
  textPx: number;
}

const BASE: Sizing = { height: 28, maxWidth: 120, padX: 16, tilePad: 4, textPx: 12 };
const MD: Sizing = { height: 36, maxWidth: 150, padX: 28, tilePad: 6, textPx: 14 };

/** Width of a brand's box. Fixed, so the track's width is known without measuring it. */
function boxWidth(brand: Brand, s: Sizing): number {
  const ratio = brand.width / brand.height;
  if (brand.treatment === "text") return Math.ceil(s.textPx * ratio);
  if (brand.treatment === "tile") {
    return Math.min(s.maxWidth, Math.round((s.height - 2 * s.tilePad) * ratio) + 2 * s.tilePad);
  }
  return Math.min(s.maxWidth, Math.round(s.height * ratio));
}

/** Width of one run through BRANDS, padding included. */
function setWidth(s: Sizing): number {
  return BRANDS.reduce((sum, brand) => sum + boxWidth(brand, s) + 2 * s.padX, 0);
}

function BrandItem({ brand, decorative }: { brand: Brand; decorative: boolean }) {
  if (brand.treatment === "text") {
    return (
      <span className="flex h-full items-center justify-center whitespace-nowrap font-extrabold text-[12px] md:text-[14px] leading-none text-white/18 transition-colors hover:text-white/60">
        {brand.name}
      </span>
    );
  }

  // Eager, not lazy: the files are tiny, and a lazy logo would pop in as it scrolls into view.
  const logo = (
    <Image
      src={brand.file}
      alt={decorative ? "" : brand.name}
      width={brand.width}
      height={brand.height}
      sizes="(min-width: 768px) 150px, 120px"
      unoptimized={brand.file.endsWith(".svg")}
      loading="eager"
      className="size-full object-contain"
    />
  );
  return brand.treatment === "tile" ? <span className="block size-full rounded-md bg-white p-1 md:p-1.5">{logo}</span> : logo;
}

/**
 * One half of the track: BRANDS, `repeats` times over. Spacing is padding on
 * each item, not a flex gap, so the two halves are exactly the same width and
 * the loop has no seam. With reduced motion only the first run is shown, as a
 * centred row that wraps.
 */
function Half({ repeats, decorative }: { repeats: number; decorative: boolean }) {
  return (
    <ul
      aria-hidden={decorative || undefined}
      className={`flex shrink-0 items-center motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 ${decorative ? "motion-reduce:hidden" : ""}`}
    >
      {Array.from({ length: repeats }, (_, run) =>
        BRANDS.map((brand) => (
          <li key={`${run}-${brand.name}`} className={`shrink-0 px-4 md:px-7 ${run > 0 ? "motion-reduce:hidden" : ""}`}>
            <div
              className="h-7 md:h-9 w-(--brand-w) md:w-(--brand-w-md)"
              style={{ "--brand-w": `${boxWidth(brand, BASE)}px`, "--brand-w-md": `${boxWidth(brand, MD)}px` } as CSSProperties}
            >
              <BrandItem brand={brand} decorative={decorative} />
            </div>
          </li>
        )),
      )}
    </ul>
  );
}

/**
 * The "Trusted by" logo banner: a full-bleed strip that scrolls right to left
 * for ever. The track holds two identical halves and slides left by exactly
 * one of them, so the loop is seamless. Motion, the edge fade, pause on hover
 * and the reduced-motion fallback are the .brand-marquee rules in globals.css.
 */
export default function BrandMarquee() {
  if (BRANDS.length === 0) return null;

  const repeats = Math.ceil(MIN_HALF_WIDTH / setWidth(MD));
  const duration = (s: Sizing) => `${(repeats * setWidth(s)) / SPEED}s`;

  return (
    <div
      className="brand-marquee"
      style={{ "--brand-marquee-duration": duration(BASE), "--brand-marquee-duration-md": duration(MD) } as CSSProperties}
    >
      <div className="brand-marquee-track">
        <Half repeats={repeats} decorative={false} />
        <Half repeats={repeats} decorative />
      </div>
    </div>
  );
}
