"use client";
import { useEffect } from "react";
import { Site } from "@/lib/data";
import PhotoPlaceholder from "./PhotoPlaceholder";
import FormatBadge from "./FormatBadge";

interface Props {
  site: Site;
  onClose: () => void;
}

const STATS_ROW = (site: Site) => [
  { label: "Daily Traffic", value: site.traffic },
  { label: "Dimensions", value: site.size },
  { label: "Illuminated", value: site.illuminated ? "Yes" : "No" },
  { label: "Format", value: site.type.charAt(0).toUpperCase() + site.type.slice(1) },
  { label: "Faces", value: site.faces },
  { label: "Monthly Rate", value: site.rate },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKLY_TRAFFIC = [65, 80, 75, 90, 95, 70, 55];

export default function SiteModal({ site, onClose }: Props) {
  const photoIdx = { digital: 1, airport: 3, traditional: 4 }[site.type] ?? 0;

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
        className="bg-sheet border border-white/10 rounded-t-2xl w-full max-w-170 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-sm bg-white/15" />
        </div>

        <div className="relative">
          <PhotoPlaceholder label={site.name} ratio="16/7" overlay photoIndex={photoIdx} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/65 border border-white/15 rounded-full w-8.5 h-8.5 cursor-pointer text-white text-base flex items-center justify-center min-h-0"
          >
            ×
          </button>
          <div className="absolute bottom-3 left-4">
            <FormatBadge type={site.type} small />
          </div>
        </div>

        <div className="pt-6 px-5 pb-8">
          <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="font-extrabold text-xl mb-1 tracking-[-0.5px]">{site.name}</h2>
              <div className="text-[13px] text-white/40">{site.city}, Tanzania</div>
            </div>
            <div className={`rounded-lg py-2.5 px-4 text-center shrink-0 border ${site.available ? "bg-lime/8 border-lime/25" : "bg-white/4 border-white/8"}`}>
              <div className={`text-[11px] font-bold tracking-[1px] uppercase ${site.available ? "text-lime" : "text-white/35"}`}>
                {site.available ? "Available" : "Booked"}
              </div>
              <div className="text-[11px] text-white/35 mt-0.5">
                {site.available ? "From next month" : site.bookedUntil}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {STATS_ROW(site).map((s) => (
              <div key={s.label} className="bg-stat border border-white/7 rounded-lg p-3">
                <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">{s.label}</div>
                <div className="text-sm font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-stat border border-white/7 rounded-lg p-4 mb-5">
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-white/30 mb-3">Weekly Traffic Pattern</div>
            <div className="flex gap-[5px] items-end h-13">
              {WEEKLY_TRAFFIC.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-sm ${i >= 5 ? "bg-white/12" : "bg-white/65"}`} style={{ height: `${h}%` }} />
                  <div className="text-[9px] text-white/30 font-bold">{DAYS[i]}</div>
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
