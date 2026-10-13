"use client";
import { useEffect } from "react";
import type { Billboard } from "@/types/billboard";
import PhotoPlaceholder from "./PhotoPlaceholder";
import FormatBadge from "./FormatBadge";
import { stockPhotoIndex } from "./BillboardCard";

interface Props {
  site: Billboard;
  onClose: () => void;
}

// Rows the backend has no value for are left out rather than shown blank.
const STATS_ROW = (site: Billboard) =>
  [
    { label: "Format", value: site.formatLabel },
    { label: "Dimensions", value: site.size },
    { label: "Illuminated", value: site.illuminated ? "Yes" : "No" },
    { label: "Backlit", value: site.backlit ? "Yes" : "No" },
    { label: "Site Code", value: site.siteCode },
    { label: "Region", value: site.region },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKLY_TRAFFIC = [65, 80, 75, 90, 95, 70, 55];

export default function SiteModal({ site, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/88 backdrop-blur-[10px] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-sheet border border-white/10 rounded-t-2xl w-full max-w-170 max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-sm bg-white/15" />
        </div>

        <div className="relative">
          <PhotoPlaceholder label={site.name} ratio="16/7" overlay sizes="(max-width: 680px) 100vw, 680px" src={site.imageUrl} photoIndex={stockPhotoIndex(site.format)} />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 bg-black/65 border border-white/15 rounded-full w-11 h-11 md:w-8.5 md:h-8.5 cursor-pointer text-white text-base flex items-center justify-center min-h-0"
          >
            ×
          </button>
          <div className="absolute top-3 left-4">
            <FormatBadge format={site.format} label={site.formatLabel} small />
          </div>
        </div>

        <div className="pt-6 px-5 pb-8">
          <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="font-extrabold text-xl mb-1 tracking-[-0.5px]">{site.name}</h2>
              <div className="text-[13px] text-white/40">{[site.address, site.region, "Tanzania"].filter(Boolean).join(", ")}</div>
            </div>
            <div className={`rounded-lg py-2.5 px-4 text-center shrink-0 border ${site.isAvailable ? "bg-white border-white" : "bg-white/4 border-white/8"}`}>
              <div className={`text-[12px] md:text-[11px] font-bold tracking-[1px] uppercase ${site.isAvailable ? "text-black" : "text-white/35"}`}>
                {site.statusLabel}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
            {STATS_ROW(site).map((s) => (
              <div key={s.label} className="bg-stat border border-white/7 rounded-lg p-3">
                <div className="text-[12px] md:text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">{s.label}</div>
                <div className="text-sm font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-stat border border-white/7 rounded-lg p-4 mb-5">
            <div className="text-[12px] md:text-[10px] font-bold tracking-[1.5px] uppercase text-white/30 mb-3">Weekly Traffic Pattern</div>
            <div className="flex gap-[5px] items-end h-13">
              {WEEKLY_TRAFFIC.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-sm ${i >= 5 ? "bg-white/12" : "bg-white/65"}`} style={{ height: `${h}%` }} />
                  <div className="text-[12px] md:text-[9px] text-white/30 font-bold">{DAYS[i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button className="bg-white border-none cursor-pointer text-black text-sm font-bold py-3.75 rounded-lg transition-opacity hover:opacity-85">
              Book This Site
            </button>
            <button className="bg-transparent border border-white/18 cursor-pointer text-white/70 text-sm font-semibold py-3.75 rounded-lg transition-colors hover:border-white/40">
              Download Spec Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
