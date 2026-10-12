"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import TanzaniaMap from "@/components/map/TanzaniaMap";
import SiteModal from "@/components/SiteModal";
import SectionHeading from "@/components/SectionHeading";
import BillboardCard from "@/components/BillboardCard";
import CampaignProcess from "@/components/campaign/CampaignProcess";
import CTABlock from "@/components/CTABlock";
import { billboardToLocation } from "@/lib/locations";
import type { Billboard } from "@/types/billboard";
import type { HeroSlot, SiteImage } from "@/types/site-content";

// `slot` names the image an editor can set for the slide (home.hero.<slot> in
// the admin); `photoIndex` is the stock photo shown until they do.
const HERO_SLIDES: { tag: string; headline: string; sub: string; slot: HeroSlot; photoIndex: number }[] = [
  { tag: "Out-of-Home Advertising", headline: "Make Your\nBrand\nUnmissable.", sub: "Tanzania's largest OOH network — 500+ sites across roads, malls, bus stands and airports.", slot: "ooh", photoIndex: 4 },
  { tag: "Digital Out-of-Home", headline: "Dynamic.\nBold.\nAlways On.", sub: "20 high-resolution LED screens across Tanzania's highest-traffic corridors.", slot: "digital", photoIndex: 0 },
  { tag: "Airport Advertising", headline: "Own the\nAirport\nExperience.", sub: "Exclusive advertising rights across Julius Nyerere International Airport Terminal 3.", slot: "airport", photoIndex: 3 },
];

const STAT_TARGETS = [500, 20, 8, 2005];
const STAT_LABELS = ["Billboard Sites", "LED Screens", "Cities Covered", "Est. Year"];
const STAT_SUFFIX = ["+", "", "", ""];

const COVERAGE = [
  { city: "Dar es Salaam", count: "300+ sites — digital, traditional, airport" },
  { city: "Arusha", count: "60+ traditional + digital" },
  { city: "Mwanza", count: "40+ traditional" },
  { city: "Dodoma", count: "25+ traditional" },
  { city: "Mbeya", count: "15+ traditional" },
];

const WHY_FEATURES = [
  { n: "01", title: "Market Leader", desc: "Ranked #1 OOH company in Tanzania by reach, inventory and client satisfaction." },
  { n: "02", title: "Premium Locations", desc: "Strategic sites on major highways, intersections, malls and airports." },
  { n: "03", title: "In-House Creative", desc: "Full creative studio for campaign design and production — one partner, end to end." },
  { n: "04", title: "Verified Data", desc: "Traffic counts at every site so you know your campaign's reach and ROI." },
];

const BRANDS = ["Vodacom", "Airtel", "CRDB Bank", "Azam", "NMB Bank", "TBL", "Coca-Cola"];

interface Props {
  billboards: Billboard[];
  usingFallback: boolean;
  /** Hero photos set in the admin, fetched on the server. A null slide keeps its stock photo. */
  heroImages: Record<HeroSlot, SiteImage | null>;
  /** Server-rendered "Our network" section, slotted in below the stats bar. */
  networkShowcase: React.ReactNode;
}

export default function HomeClient({ billboards, usingFallback, heroImages, networkShowcase }: Props) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [countVisible, setCountVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Billboard | null>(null);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % 3), 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setCountVisible(true); }, { threshold: 0.3 });
    if (countRef.current) obs.observe(countRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!countVisible) return;
    STAT_TARGETS.forEach((end, idx) => {
      let val = 0; const step = end / 55;
      const id = setInterval(() => {
        val += step;
        if (val >= end) { val = end; clearInterval(id); }
        setCounts((prev) => { const n = [...prev]; n[idx] = Math.floor(val); return n; });
      }, 18);
    });
  }, [countVisible]);

  const locations = useMemo(() => billboards.map(billboardToLocation), [billboards]);
  const slide = HERO_SLIDES[heroIdx];

  return (
    <div className="bg-canvas text-white">

      {/* svh, not vh: on a phone 100vh is the height with the address bar hidden, which pushes the buttons and dots off screen. */}
      <section className="relative min-h-svh overflow-hidden">
        <div className="absolute inset-0 z-0">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${heroIdx === i ? "opacity-100" : "opacity-0"}`}>
              <div className="absolute inset-0 overflow-hidden">
                {/* Only the first slide is on screen at load, so only it is preloaded. */}
                <PhotoPlaceholder
                  ratio="1/1"
                  overlay={false}
                  photoIndex={s.photoIndex}
                  src={heroImages[s.slot]?.url}
                  alt={heroImages[s.slot]?.alt || undefined}
                  sizes="100vw"
                  preload={i === 0}
                  fill
                />
              </div>
              {/* On a phone the text is centred across the full width, so the scrim is even: 76% black is the
                  lightest that keeps the sub text (white at 55%) at 4.5:1 over a pure white photo. From md up
                  the text sits on the left and the scrim fades out to the right, as designed. */}
              <div className="absolute inset-0 bg-black/76 md:bg-transparent md:bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.25)_100%)]" />
            </div>
          ))}
        </div>

        <div className="relative z-1 min-h-svh flex flex-col justify-center pt-25 sm:pt-30 md:pt-35 lg:pt-40 px-(--gutter) md:px-6 lg:px-8 pb-20 max-w-300 mx-auto">
          {/* Centred below md, left-aligned from md up. */}
          <div className="max-w-140 mx-auto text-center md:mx-0 md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-7">
              <div className="w-6 h-px bg-white/45" />
              <span className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/50 uppercase">{slide.tag}</span>
            </div>
            <h1 className="font-black text-[44px] sm:text-[64px] lg:text-[88px] leading-none mb-6 tracking-[-2px] whitespace-pre-line text-balance md:text-wrap">{slide.headline}</h1>
            <p className="text-[14px] sm:text-[15px] lg:text-[17px] font-normal text-white/55 leading-[1.75] mb-10 max-w-105 mx-auto md:mx-0">{slide.sub}</p>
            {/* Below md the two buttons share the row equally; if they can't fit side by side they stack, each full width. */}
            <div className="flex gap-3 flex-wrap justify-center mb-15 max-w-88 mx-auto md:justify-start md:max-w-none md:mx-0">
              <Link href="/contact" className="bg-white text-black text-[13px] font-bold py-3.5 px-5 sm:px-6 lg:px-7 rounded-md no-underline inline-flex items-center grow basis-[calc(50%-0.375rem)] justify-center whitespace-nowrap md:grow-0 md:basis-auto md:justify-start md:whitespace-normal">Start a Campaign</Link>
              <Link href="/gallery" className="bg-transparent border border-white/30 text-white/85 text-[13px] font-semibold py-3.5 px-5 sm:px-6 lg:px-7 rounded-md no-underline inline-flex items-center grow basis-[calc(50%-0.375rem)] justify-center whitespace-nowrap md:grow-0 md:basis-auto md:justify-start md:whitespace-normal">View Locations →</Link>
            </div>
            {/* Below md each dot sits in a 44px tap area; from md up the button is just the bar, as before. */}
            <div className="flex justify-center md:justify-start md:gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === heroIdx ? "true" : undefined}
                  className="flex items-center justify-center h-11 min-w-11 md:justify-start md:h-auto md:min-w-0 bg-transparent border-none cursor-pointer p-0 min-h-0"
                >
                  <span className={`block h-1 rounded-sm transition-all duration-350 ${i === heroIdx ? "w-7 bg-white" : "w-2 bg-white/25"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={countRef} className="bg-raised border-t border-t-white/6 border-b border-b-white/6 py-14 px-(--gutter) md:px-6 lg:px-8">
        <div className="max-w-300 mx-auto grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8">
          {counts.map((count, i) => (
            <div key={i} className="text-center">
              <div className="font-black text-[36px] sm:text-[46px] lg:text-[56px] tracking-[-2px] leading-none">{count}{STAT_SUFFIX[i]}</div>
              <div className="text-xs font-semibold tracking-[2px] text-white/35 uppercase mt-2">{STAT_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </section>

      {networkShowcase}

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-(--gutter) md:px-6 lg:px-8 max-w-300 mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 sm:gap-14 lg:gap-20 items-start">
          <div>
            <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Coverage</div>
            <SectionHeading lead="Nationwide" accent="Network" className="text-[26px] sm:text-[36px] lg:text-[48px] mb-5 tracking-[-1.5px] leading-[1.05]" />
            <p className="text-[15px] text-white/45 leading-[1.8] mb-8 max-w-95">From Dar es Salaam to Arusha, Mwanza to Dodoma — Ashton Media covers Tanzania&apos;s most important markets.</p>
            <div className="border-t border-t-white/8">
              {COVERAGE.map((loc) => (
                <div key={loc.city} className="py-3.5 border-b border-b-white/6 flex justify-between gap-4 flex-wrap">
                  <span className="font-bold text-sm">{loc.city}</span>
                  <span className="text-xs text-white/35">{loc.count}</span>
                </div>
              ))}
            </div>
            <Link href="/gallery" className="inline-block mt-7 bg-white text-black text-[13px] font-bold py-3.25 px-6.5 rounded-md no-underline">Explore All Locations</Link>
          </div>
          <Link href="/gallery" className="bg-card rounded-[10px] border border-white/8 p-6 flex items-center justify-center min-h-100 no-underline">
            <TanzaniaMap locations={locations} usingFallback={usingFallback} />
          </Link>
        </div>
      </section>

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-(--gutter) md:px-6 lg:px-8 max-w-300 mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 sm:gap-14 lg:gap-20 items-start">
          <div>
            <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Why Choose Us</div>
            <SectionHeading lead="Tanzania's #1" accent="OOH Company" className="text-[26px] sm:text-[36px] lg:text-[48px] mb-5 tracking-[-1.5px] leading-[1.05]" />
            <p className="text-[15px] text-white/45 leading-[1.8] mb-8 max-w-95">Founded in 2005, Ashton Media has built Tanzania&apos;s most comprehensive out-of-home network — award-winning creative, strategy and execution under one roof.</p>
            <Link href="/contact" className="inline-block bg-white text-black text-[13px] font-bold py-3.25 px-6.5 rounded-md no-underline">Request a Proposal</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {WHY_FEATURES.map((f) => (
              <div key={f.n} className="bg-card border border-white/7 rounded-[10px] py-4.5 sm:py-6 lg:py-7 px-4 sm:px-5 lg:px-6">
                <div className="font-black text-[28px] text-white/7 mb-3.5 tracking-[-1px]">{f.n}</div>
                <h4 className="font-bold text-sm mb-1.75">{f.title}</h4>
                <p className="text-[13px] text-white/38 leading-[1.65]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CampaignProcess variant="condensed" />

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-(--gutter) md:px-6 lg:px-8 bg-raised">
        <div className="max-w-300 mx-auto">
          <div className="flex justify-between items-end mb-9 flex-wrap gap-4">
            <div>
              <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-2.5">Inventory</div>
              <h2 className="font-black text-[24px] sm:text-[32px] lg:text-[40px] tracking-[-1.5px] leading-[1.05]">Available Now</h2>
            </div>
            <Link href="/gallery" className="text-[13px] font-semibold text-white/50 no-underline">View all sites →</Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {billboards.filter((b) => b.isAvailable).slice(0, 3).map((site) => (
              <button key={site.id} onClick={() => setSelectedSite(site)} className="bg-card border border-white/7 rounded-[10px] overflow-hidden text-left cursor-pointer text-white w-full p-0 hover:border-white/18">
                <BillboardCard billboard={site} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-(--gutter) md:px-6 lg:px-8 border-t border-t-white/6 bg-raised">
        <div className="max-w-300 mx-auto text-center">
          <p className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/22 uppercase mb-8">Trusted by Tanzania&apos;s leading brands</p>
          <div className="flex gap-6 sm:gap-10 lg:gap-14 justify-center flex-wrap items-center">
            {BRANDS.map((b) => (
              <span key={b} className="font-extrabold text-[12px] sm:text-[13px] lg:text-[14px] text-white/18 transition-colors hover:text-white/60">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <CTABlock />

      {selectedSite && <SiteModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );
}
