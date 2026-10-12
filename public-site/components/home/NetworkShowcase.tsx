import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { getBillboardCounts } from "@/lib/api/billboards";
import { getSiteContent, slotImage } from "@/lib/api/site-content";
import SectionHeading from "@/components/SectionHeading";
import type { BillboardFormat } from "@/types/billboard";
import type { SiteImageKey } from "@/types/site-content";

interface Tile {
  format: BillboardFormat;
  label: string;
  href: string;
  /** The slot editors fill in the admin (Site Images). It wins when it has an image. */
  slot: SiteImageKey;
  /** Fallback: basename in public/images/network/ — see the README there for specs. */
  image: string;
  /** Shown in place of the count while the backend has no records for this format. */
  descriptor: string;
  /** Stand-in gradient until the photo exists. */
  placeholder: string;
}

const TILES: Tile[] = [
  { format: "static", label: "Static", href: "/traditional", slot: "networks.static", image: "tile-static", descriptor: "Roads, junctions and malls", placeholder: "bg-linear-to-br from-white/12 via-card to-canvas" },
  { format: "digital", label: "Digital", href: "/digital", slot: "networks.digital", image: "tile-digital", descriptor: "LED screens", placeholder: "bg-linear-to-bl from-stat via-white/8 to-canvas" },
  { format: "airport", label: "Airport", href: "/airport", slot: "networks.airport", image: "tile-airport", descriptor: "JNIA Terminal 3", placeholder: "bg-linear-to-tr from-canvas via-placeholder-start to-white/10" },
  { format: "station", label: "SGR", href: "/gallery", slot: "networks.station", image: "tile-sgr", descriptor: "Railway stations", placeholder: "bg-linear-to-b from-white/8 via-card-alt to-canvas" },
];

const OVERFLOW_LINKS = [{ label: "Light poles", href: "/gallery" }];

const IMAGE_DIR = path.join(process.cwd(), "public", "images", "network");

function tileImageSrc(image: string): string | null {
  return fs.existsSync(path.join(IMAGE_DIR, `${image}.webp`)) ? `/images/network/${image}.webp` : null;
}

// Hover and keyboard focus get the same treatment. Reduced motion keeps the
// brightness lift but drops the zoom. A screen that can't hover would be stuck
// on the dimmed state, so it shows the lifted one from the start.
const MEDIA_CLASSES =
  "grayscale-35 brightness-72 transition-[scale,filter] duration-500 ease-out " +
  "[@media(hover:none)]:grayscale-0 [@media(hover:none)]:brightness-92 " +
  "group-hover:scale-[1.045] group-hover:grayscale-0 group-hover:brightness-92 " +
  "group-focus-visible:scale-[1.045] group-focus-visible:grayscale-0 group-focus-visible:brightness-92 " +
  "motion-reduce:transition-[filter] motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100";

const PILL_CLASSES = "inline-flex items-center rounded-full border py-2 px-4.5 text-xs font-semibold no-underline transition-colors duration-350";

export default async function NetworkShowcase() {
  const [counts, content] = await Promise.all([getBillboardCounts(), getSiteContent()]);

  return (
    <section className="bg-canvas py-15 sm:py-18 md:py-22 lg:py-25">
      <div className="text-center px-(--gutter) md:px-6 lg:px-8 mb-9 sm:mb-12 lg:mb-14">
        <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-4">Our network</div>
        <SectionHeading lead="Every format." accent="Every city." className="text-[30px] sm:text-[44px] lg:text-[58px] tracking-[-1.5px] leading-[1.05]" />
      </div>

      {/* Full-bleed band. The 1px gaps let the grid background show through as rules. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border-y border-white/10">
        {TILES.map((tile) => {
          const adminImage = slotImage(content, tile.slot);
          const src = adminImage?.url ?? tileImageSrc(tile.image);
          const count = counts[tile.format];
          return (
            <Link
              key={tile.format}
              href={tile.href}
              className="group relative block aspect-4/5 sm:aspect-3/4 overflow-hidden bg-canvas text-white no-underline outline-none"
            >
              {src ? (
                <Image src={src} alt={adminImage?.alt ?? ""} fill sizes="(min-width: 1024px) 25vw, 50vw" className={`object-cover ${MEDIA_CLASSES}`} />
              ) : (
                <div aria-hidden className={`absolute inset-0 ${tile.placeholder} ${MEDIA_CLASSES}`} />
              )}
              <div aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-canvas/95" />

              <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6 lg:left-8 lg:bottom-8">
                <div className="font-extrabold uppercase text-[17px] sm:text-[22px] lg:text-[26px] tracking-[0.5px] leading-none">{tile.label}</div>
                <div className="h-px w-5.5 bg-accent mt-3.5 transition-[width] duration-400 ease-out group-hover:w-11.5 group-focus-visible:w-11.5" />
                <div className="mt-3 text-xs text-white/50 opacity-0 translate-y-2 transition-[opacity,translate] duration-400 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-opacity [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0">
                  {count > 0 ? `${count} ${count === 1 ? "site" : "sites"}` : tile.descriptor}
                </div>
              </div>

              {/* Focus ring as its own top layer — an outline on the link itself gets painted under the image. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 border-2 border-transparent group-focus-visible:border-accent" />
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 px-(--gutter) md:px-6 lg:px-8 mt-8 sm:mt-10">
        {/* <span className="text-xs text-white/40 mr-1">Also on the network</span> */}
        {/* {OVERFLOW_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className={`${PILL_CLASSES} border-white/15 text-white/65 hover:border-white/40 hover:text-white`}>
            {link.label}
          </Link>
        ))} */}
        <Link href="/gallery" className={`${PILL_CLASSES} border-accent/45 text-accent hover:border-accent`}>
          The whole network →
        </Link>
      </div>
    </section>
  );
}
