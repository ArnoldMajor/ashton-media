import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { SITES } from "@/lib/data";
import Link from "next/link";

const FEATURES = [
  { icon: "📍", title: "Prime Locations", desc: "Strategically selected sites at Tanzania's most valuable intersections, highways, and commercial areas." },
  { icon: "💡", title: "Full Illumination", desc: "Most sites are illuminated for 24/7 impact — your message works around the clock." },
  { icon: "📐", title: "Large Formats", desc: "Standard 12×4m and premium 18×6m gantry formats for maximum visual impact." },
  { icon: "📊", title: "Traffic Verified", desc: "Independent traffic counts at every location so you can plan campaigns with confidence." },
];

export default function TraditionalPage() {
  const traditionalSites = SITES.filter((s) => s.type === "traditional");

  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Traditional Out-of-Home"
        tag="Static Billboards"
        sub="From roadside gantries to mall façades — our traditional OOH network delivers unbeatable reach across Tanzania's highest-traffic corridors."
      />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">

        <div className="rounded-xl overflow-hidden mb-15">
          <PhotoPlaceholder ratio="21/9" overlay label="Traditional Billboard — Morogoro Road" photoIndex={4} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-15">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-white/7 rounded-[10px] py-7 px-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-extrabold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-white/40 leading-[1.65]">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-15">
          <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-6 tracking-[-1px]">Traditional Sites</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {traditionalSites.map((site) => (
              <Link
                key={site.id}
                href="/gallery"
                className="block bg-card border border-white/7 rounded-[10px] overflow-hidden no-underline text-white"
              >
                <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
                <div className="p-4">
                  <h4 className="font-bold text-sm mb-1">{site.name}</h4>
                  <p className="text-xs text-white/35 mt-2">{site.city} · {site.size}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <CTABar />
      </div>
    </div>
  );
}
