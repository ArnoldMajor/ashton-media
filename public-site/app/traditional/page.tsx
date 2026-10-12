import { PageHero } from "@/components/PageSections";
import CTABlock from "@/components/CTABlock";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import BillboardCard from "@/components/BillboardCard";
import { getBillboardsByFormat } from "@/lib/api/billboards";
import { getSiteContent, slotImage } from "@/lib/api/site-content";
import Link from "next/link";
import { BarChartIcon, BulbIcon, PinIcon, SetSquareIcon } from "@/components/icons";

// Each feature names its icon by meaning; the components live in components/icons.tsx.
const FEATURE_ICONS = {
  location: PinIcon,
  lighting: BulbIcon,
  size: SetSquareIcon,
  data: BarChartIcon,
};

const FEATURES: { icon: keyof typeof FEATURE_ICONS; title: string; desc: string }[] = [
  { icon: "location", title: "Prime Locations", desc: "Strategically selected sites at Tanzania's most valuable intersections, highways, and commercial areas." },
  { icon: "lighting", title: "Full Illumination", desc: "Most sites are illuminated for 24/7 impact — your message works around the clock." },
  { icon: "size", title: "Large Formats", desc: "Standard 12×4m and premium 18×6m gantry formats for maximum visual impact." },
  { icon: "data", title: "Traffic Verified", desc: "Independent traffic counts at every location so you can plan campaigns with confidence." },
];

export default async function TraditionalPage() {
  const [byFormat, content] = await Promise.all([getBillboardsByFormat(), getSiteContent()]);
  const traditionalSites = byFormat.static;
  // Set in the admin (Site Images). Until it is, the banner keeps its stock photo.
  const banner = slotImage(content, "traditional.banner");

  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Traditional Out-of-Home"
        tag="Static Billboards"
        sub="From roadside gantries to mall façades — our traditional OOH network delivers unbeatable reach across Tanzania's highest-traffic corridors."
      />

      <div className="max-w-300 mx-auto py-15 px-(--gutter) md:px-6 lg:px-8">

        <div className="rounded-xl overflow-hidden mb-15">
          <PhotoPlaceholder ratio="21/9" overlay label="Traditional Billboard — Morogoro Road" photoIndex={4} src={banner?.url} alt={banner?.alt || undefined} sizes="(max-width: 1200px) 100vw, 1136px" />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-15">
          {FEATURES.map((f) => {
            const FeatureIcon = FEATURE_ICONS[f.icon];
            return (
            <div key={f.title} className="bg-card border border-white/7 rounded-[10px] py-7 px-6">
              {/* The icon sits in the 32px line the emoji used to occupy. It is drawn at 28px, and pulled left by
                  its own inner margin, so the artwork is the emoji's size and starts where the heading does. */}
              <div className="text-2xl mb-3 h-8 flex items-center"><FeatureIcon className="size-7 -ml-1" /></div>
              <h3 className="font-extrabold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-white/40 leading-[1.65]">{f.desc}</p>
            </div>
            );
          })}
        </div>

        {traditionalSites.length > 0 && (
        <div className="mb-15">
          <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-6 tracking-[-1px]">Traditional Sites</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {traditionalSites.map((site) => (
              <Link
                key={site.id}
                href="/gallery"
                className="block bg-card border border-white/7 rounded-[10px] overflow-hidden no-underline text-white"
              >
                <BillboardCard billboard={site} showBadge={false} />
              </Link>
            ))}
          </div>
        </div>
        )}

      </div>

      <CTABlock />
    </div>
  );
}
