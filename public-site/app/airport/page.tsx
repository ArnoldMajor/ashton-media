import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { SITES } from "@/lib/data";
import Link from "next/link";

const STATS = [
  ["8,000+", "daily passengers"],
  ["90 min", "average dwell time"],
  ["65%", "business travellers"],
  ["12+", "advertising positions"],
];

const POSITIONS = [
  { title: "Check-In Hall", desc: "Large-format backlit panels above all check-in desks — 100% passenger coverage." },
  { title: "Departure Lounge", desc: "Premium digital screens and print panels throughout the seating and retail area." },
  { title: "Baggage Reclaim", desc: "Captive audience of arriving passengers with long dwell times — ideal for brand recall." },
  { title: "Escalators & Walkways", desc: "Sequential panels that build a narrative as travellers move through the terminal." },
];

export default function AirportPage() {
  const airportSites = SITES.filter((s) => s.type === "airport");

  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Airport Advertising"
        tag="JNIA Terminal 3"
        sub="Exclusive advertising rights at Julius Nyerere International Airport Terminal 3 — Tanzania's gateway to the world."
      />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">

        <div className="rounded-xl overflow-hidden mb-15">
          <PhotoPlaceholder ratio="21/9" overlay label="JNIA Terminal 3" photoIndex={3} />
        </div>

        <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:gap-20 mb-15 items-center">
          <div>
            <div className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-3">Why Airport</div>
            <h2 className="font-black text-[24px] sm:text-[34px] lg:text-[44px] mb-5 tracking-[-1.5px] leading-[1.05]">
              Captive. Premium.<br />Unmatched.
            </h2>
            <p className="text-[15px] text-white/45 leading-[1.8] mb-6">
              Airport audiences are uniquely captive — they dwell for an average of 90 minutes. They're high-income, decision-making professionals. And they're already primed to notice.
            </p>
            <div className="flex flex-col gap-3">
              {STATS.map(([n, l]) => (
                <div key={l} className="flex items-center gap-4">
                  <div className="font-black text-2xl tracking-[-1px] min-w-20">{n}</div>
                  <div className="text-[13px] text-white/40">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {POSITIONS.map((f) => (
              <div key={f.title} className="bg-card border border-white/7 rounded-[10px] py-5 px-6">
                <h4 className="font-bold text-sm mb-1.5">{f.title}</h4>
                <p className="text-[13px] text-white/40 leading-[1.6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-6 tracking-[-1px]">Airport Positions</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-15">
          {airportSites.map((site) => (
            <Link key={site.id} href="/gallery" className="block bg-card border border-white/7 rounded-[10px] overflow-hidden no-underline text-white">
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
              <div className="p-4">
                <h4 className="font-bold text-sm mb-2">{site.name}</h4>
                <p className="text-xs text-white/35">{site.city} · {site.size}</p>
              </div>
            </Link>
          ))}
        </div>

        <CTABar />
      </div>
    </div>
  );
}
