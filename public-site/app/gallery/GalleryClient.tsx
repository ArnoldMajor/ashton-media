"use client";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/PageSections";
import BillboardCard from "@/components/BillboardCard";
import SiteModal from "@/components/SiteModal";
import TanzaniaMap from "@/components/map/TanzaniaMap";
import { billboardToLocation } from "@/lib/locations";
import type { Billboard } from "@/types/billboard";
import type { Location } from "@/types/location";

interface Props {
  billboards: Billboard[];
  usingFallback: boolean;
}

export default function GalleryClient({ billboards, usingFallback }: Props) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Billboard | null>(null);

  const locations = useMemo(() => billboards.map(billboardToLocation), [billboards]);

  // One filter per format actually on the network, labelled as the API names it.
  const filters = useMemo(() => {
    const labels = new Set(billboards.map((b) => b.formatLabel));
    return [
      { key: "all", label: "All Locations" },
      ...Array.from(labels, (label) => ({ key: `format:${label}`, label })),
      { key: "available", label: "Available Now" },
    ];
  }, [billboards]);

  const query = search.trim().toLowerCase();
  const filtered = billboards.filter((b) => {
    const matchType = filter === "all" ? true : filter === "available" ? b.isAvailable : filter === `format:${b.formatLabel}`;
    const matchSearch = query === "" ? true : [b.name, b.region, b.address].some((field) => field.toLowerCase().includes(query));
    return matchType && matchSearch;
  });

  const handleMarkerSelect = (loc: Location) => {
    const site = billboards.find((b) => b.id === loc.id);
    if (site) setSelected(site);
  };

  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Locations & Sites"
        tag="Billboard Gallery"
        sub="Browse our full inventory of premium billboard sites across Tanzania. Click any site to see availability, traffic data and pricing."
      />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="flex gap-3 mb-10 flex-wrap items-center">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`border py-2.25 px-5 rounded-full text-xs font-bold cursor-pointer transition-all min-h-0 ${
                filter === f.key ? "bg-white border-text text-black" : "bg-transparent border-white/15 text-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="bg-card-alt border border-white/12 rounded-lg text-white text-[13px] py-2.5 pl-9 pr-4 outline-none w-55"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.2" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <p className="text-[13px] text-white/30 mb-6">
          {filtered.length} {filtered.length === 1 ? "site" : "sites"} found
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-15">
          {filtered.map((site) => (
            <button
              key={site.id}
              onClick={() => setSelected(site)}
              className="bg-card border border-white/7 rounded-[10px] overflow-hidden text-left cursor-pointer text-white w-full p-0 transition-colors hover:border-white/18"
            >
              <BillboardCard billboard={site} />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Map View</div>
            <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-4 tracking-[-1px]">Tanzania Coverage</h2>
            <p className="text-sm text-white/40 leading-[1.7] max-w-80">
              Circles are digital screens, squares are static billboards, diamonds are airport positions. Numbered circles are clusters — click one to zoom in. Faded markers are currently booked.
            </p>
          </div>
          <div className="bg-card rounded-[10px] border border-white/8 p-6 flex items-center justify-center min-h-80">
            <TanzaniaMap locations={locations} interactive onSelect={handleMarkerSelect} usingFallback={usingFallback} />
          </div>
        </div>
      </div>

      {selected && <SiteModal site={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
