"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import TanzaniaMap from "@/components/TanzaniaMap";
import SiteModal from "@/components/SiteModal";
import FormatBadge from "@/components/FormatBadge";
import { SITES, Site } from "@/lib/data";

const HERO_SLIDES = [
  { tag: "Out-of-Home Advertising", headline: "Make Your\nBrand\nUnmissable.", sub: "Tanzania's largest OOH network — 500+ sites across roads, malls, bus stands and airports.", photoIndex: 4 },
  { tag: "Digital Out-of-Home", headline: "Dynamic.\nBold.\nAlways On.", sub: "20 high-resolution LED screens across Tanzania's highest-traffic corridors.", photoIndex: 0 },
  { tag: "Airport Advertising", headline: "Own the\nAirport\nExperience.", sub: "Exclusive advertising rights across Julius Nyerere International Airport Terminal 3.", photoIndex: 3 },
];

const STAT_TARGETS = [500, 20, 8, 2005];
const STAT_LABELS = ["Billboard Sites", "LED Screens", "Cities Covered", "Est. Year"];
const STAT_SUFFIX = ["+", "", "", ""];

const SOLUTIONS_CARDS = [
  { type: "traditional" as const, title: "Traditional OOH", desc: "Static and illuminated billboards at Tanzania's busiest roads, intersections, and malls.", href: "/traditional", photoIndex: 4 },
  { type: "digital" as const, title: "Digital OOH", desc: "20 high-resolution LED screens with dynamic content, real-time scheduling, and traffic data.", href: "/digital", photoIndex: 0 },
  { type: "airport" as const, title: "Airport Advertising", desc: "Premium placements inside Julius Nyerere International Airport Terminal 3.", href: "/airport", photoIndex: 3 },
];

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

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [countVisible, setCountVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
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

  const slide = HERO_SLIDES[heroIdx];

  return (
    <div className="bg-canvas text-white">

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${heroIdx === i ? "opacity-100" : "opacity-0"}`}>
              <div className="absolute inset-0 overflow-hidden">
                <PhotoPlaceholder ratio="1/1" overlay={false} photoIndex={s.photoIndex} fill />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.25)_100%)]" />
            </div>
          ))}
        </div>

        <div className="relative z-1 min-h-screen flex flex-col justify-center pt-25 sm:pt-30 md:pt-35 lg:pt-40 px-2.5 sm:px-4 md:px-6 lg:px-8 pb-20 max-w-300 mx-auto">
          <div className="max-w-140">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-6 h-px bg-white/45" />
              <span className="text-[11px] font-semibold tracking-[3px] text-white/50 uppercase">{slide.tag}</span>
            </div>
            <h1 className="font-black text-[44px] sm:text-[64px] lg:text-[88px] leading-none mb-6 tracking-[-2px] whitespace-pre-line">{slide.headline}</h1>
            <p className="text-[14px] sm:text-[15px] lg:text-[17px] font-normal text-white/55 leading-[1.75] mb-10 max-w-105">{slide.sub}</p>
            <div className="flex gap-3 flex-wrap mb-15">
              <Link href="/contact" className="bg-white text-black text-[13px] font-bold py-3.5 px-5 sm:px-6 lg:px-7 rounded-md no-underline inline-flex items-center">Start a Campaign</Link>
              <Link href="/gallery" className="bg-transparent border border-white/30 text-white/85 text-[13px] font-semibold py-3.5 px-5 sm:px-6 lg:px-7 rounded-md no-underline inline-flex items-center">View Locations →</Link>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className={`h-1 rounded-sm border-none cursor-pointer p-0 min-h-0 transition-all duration-350 ${i === heroIdx ? "w-7 bg-white" : "w-2 bg-white/25"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={countRef} className="bg-raised border-t border-t-white/6 border-b border-b-white/6 py-14 px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-300 mx-auto grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8">
          {counts.map((count, i) => (
            <div key={i} className="text-center">
              <div className="font-black text-[36px] sm:text-[46px] lg:text-[56px] tracking-[-2px] leading-none">{count}{STAT_SUFFIX[i]}</div>
              <div className="text-xs font-semibold tracking-[2px] text-white/35 uppercase mt-2">{STAT_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-2.5 sm:px-4 md:px-6 lg:px-8 max-w-300 mx-auto">
        <div className="text-center mb-9 sm:mb-12 lg:mb-14">
          <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Our Solutions</div>
          <h2 className="font-black text-[28px] sm:text-[40px] lg:text-[52px] tracking-[-1.5px] leading-[1.05]">Every Format.<br />Every Location.</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {SOLUTIONS_CARDS.map((s) => (
            <Link key={s.href} href={s.href} className="block bg-card border border-white/7 rounded-xl overflow-hidden no-underline text-white hover:border-white/18">
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={s.photoIndex} />
              <div className="p-6">
                <div className="mb-2.5"><FormatBadge type={s.type} /></div>
                <h3 className="font-extrabold text-[17px] mb-2 tracking-[-0.5px]">{s.title}</h3>
                <p className="text-[13px] text-white/40 leading-[1.65] mb-4">{s.desc}</p>
                <div className="text-xs font-bold text-white/50">Explore →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-2.5 sm:px-4 md:px-6 lg:px-8 max-w-300 mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 sm:gap-14 lg:gap-20 items-start">
          <div>
            <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Coverage</div>
            <h2 className="font-black text-[26px] sm:text-[36px] lg:text-[48px] mb-5 tracking-[-1.5px] leading-[1.05]">Nationwide<br />Network</h2>
            <p className="text-[15px] text-white/45 leading-[1.8] mb-8 max-w-95">From Dar es Salaam to Arusha, Mwanza to Dodoma — Ashton Media covers Tanzania's most important markets.</p>
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
            <TanzaniaMap />
          </Link>
        </div>
      </section>

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-2.5 sm:px-4 md:px-6 lg:px-8 max-w-300 mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 sm:gap-14 lg:gap-20 items-start">
          <div>
            <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Why Choose Us</div>
            <h2 className="font-black text-[26px] sm:text-[36px] lg:text-[48px] mb-5 tracking-[-1.5px] leading-[1.05]">Tanzania's #1<br />OOH Company</h2>
            <p className="text-[15px] text-white/45 leading-[1.8] mb-8 max-w-95">Founded in 2005, Ashton Media has built Tanzania's most comprehensive out-of-home network — award-winning creative, strategy and execution under one roof.</p>
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

      <section className="py-15 sm:py-18 md:py-22 lg:py-25 px-2.5 sm:px-4 md:px-6 lg:px-8 bg-raised">
        <div className="max-w-300 mx-auto">
          <div className="flex justify-between items-end mb-9 flex-wrap gap-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-2.5">Inventory</div>
              <h2 className="font-black text-[24px] sm:text-[32px] lg:text-[40px] tracking-[-1.5px] leading-[1.05]">Available Now</h2>
            </div>
            <Link href="/gallery" className="text-[13px] font-semibold text-white/50 no-underline">View all sites →</Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {SITES.filter((s) => s.available).slice(0, 3).map((site) => (
              <button key={site.id} onClick={() => setSelectedSite(site)} className="bg-card border border-white/7 rounded-[10px] overflow-hidden text-left cursor-pointer text-white w-full p-0 hover:border-white/18">
                <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
                <div className="p-4">
                  <div className="mb-2.5"><FormatBadge type={site.type} small /></div>
                  <h4 className="font-bold text-sm mb-1 tracking-[-0.3px]">{site.name}</h4>
                  <p className="text-xs text-white/35">{site.city} · {site.size}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-2.5 sm:px-4 md:px-6 lg:px-8 border-t border-t-white/6 bg-raised">
        <div className="max-w-300 mx-auto text-center">
          <p className="text-[11px] font-semibold tracking-[3px] text-white/22 uppercase mb-8">Trusted by Tanzania's leading brands</p>
          <div className="flex gap-6 sm:gap-10 lg:gap-14 justify-center flex-wrap items-center">
            {BRANDS.map((b) => (
              <span key={b} className="font-extrabold text-[12px] sm:text-[13px] lg:text-[14px] text-white/18 transition-colors hover:text-white/60">{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 lg:py-30 px-2.5 sm:px-4 md:px-6 lg:px-8 text-center">
        <div className="max-w-140 mx-auto">
          <h2 className="font-black text-[32px] sm:text-[48px] lg:text-[64px] mb-4.5 tracking-[-2px] leading-none">Ready to get<br />noticed?</h2>
          <p className="text-base text-white/40 mb-9 leading-[1.7]">Talk to our team about locations, pricing and creative options.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="bg-white text-black text-sm font-bold py-3.75 px-6 sm:px-8 lg:px-9 rounded-md no-underline inline-flex items-center">Start a Campaign</Link>
            <a href="tel:+255758880088" className="inline-flex items-center border border-white/20 text-white/70 no-underline text-sm font-semibold py-3.75 px-6 sm:px-8 lg:px-9 rounded-md">+255 758 88 00 88</a>
          </div>
        </div>
      </section>

      {selectedSite && <SiteModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );
}
