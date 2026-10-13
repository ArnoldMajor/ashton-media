import { PageHero } from "@/components/PageSections";
import CTABlock from "@/components/CTABlock";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import FormatBadge from "@/components/FormatBadge";
import { getCaseStudies } from "@/lib/api/case-studies";
import { coverScale } from "@/lib/photos";
import type { BillboardFormat } from "@/types/billboard";
import type { CaseStudy, CaseStudyMetric } from "@/types/case-study";

/**
 * FALLBACK ONLY. The live page reads case studies from the Django API
 * (Marketing → Case Studies in the admin); these four are shown when the API
 * can't be reached, so the page never goes blank.
 */
const CASE_STUDIES = [
  { brand: "Vodacom Tanzania", type: "digital" as const, headline: "15M+ Impressions in 30 Days", desc: "A 4-screen digital network campaign across Dar es Salaam's CBD drove brand recall up 38% among the target demographic.", metric1: { n: "15M+", l: "impressions" }, metric2: { n: "38%", l: "recall lift" }, photoIndex: 0 },
  { brand: "CRDB Bank", type: "static" as const, headline: "Full-City Saturation Launch", desc: "20-billboard roadside takeover across Dar es Salaam to support a new product launch — campaign reached 2.4M people over 8 weeks.", metric1: { n: "2.4M", l: "reach" }, metric2: { n: "8 wks", l: "duration" }, photoIndex: 4 },
  { brand: "Azam FC", type: "airport" as const, headline: "Terminal 3 Sponsorship", desc: "Season-long airport takeover targeting arriving business travellers, positioning Azam as Tanzania's premium brand.", metric1: { n: "12", l: "positions" }, metric2: { n: "365d", l: "campaign" }, photoIndex: 3 },
  { brand: "Airtel Tanzania", type: "digital" as const, headline: "Dynamic Daypart Campaign", desc: "Time-of-day targeted content on 8 LED screens — morning commute messages drove 24% higher response rate vs. static creative.", metric1: { n: "24%", l: "higher CTR" }, metric2: { n: "8", l: "screens" }, photoIndex: 1 },
];

// The photo's frame is half of the 1136px content column, at 4:3. A wider
// photo is cropped to the frame's height and drawn wider than it: see coverScale.
function photoSizes(photo?: Parameters<typeof coverScale>[0]): string {
  const scale = coverScale(photo, 4 / 3);
  return `(min-width: 768px) ${Math.ceil(568 * scale)}px, ${Math.ceil(100 * scale)}vw`;
}

/** What one card draws, whichever source it came from. */
interface Card {
  key: string | number;
  brand: string;
  /** A billboard format for the hardcoded studies; the editor's own badge text for API ones. */
  badge: { format: BillboardFormat; label?: string } | null;
  headline: string;
  description: string;
  metrics: CaseStudyMetric[];
  /** `src` is the editor's photo; without one the stock photo at `photoIndex` is used. */
  photo: { src?: string; alt?: string; photoIndex?: number; sizes: string };
}

const FALLBACK_CARDS: Card[] = CASE_STUDIES.map((cs) => ({
  key: cs.brand,
  brand: cs.brand,
  badge: { format: cs.type },
  headline: cs.headline,
  description: cs.desc,
  metrics: [cs.metric1, cs.metric2].map((m) => ({ value: m.n, label: m.l })),
  photo: { photoIndex: cs.photoIndex, sizes: photoSizes() },
}));

function toCard(study: CaseStudy): Card {
  return {
    key: study.id,
    brand: study.brand,
    badge: study.formatLabel ? { format: "other", label: study.formatLabel } : null,
    headline: study.headline,
    description: study.description,
    metrics: study.metrics,
    photo: { src: study.image.url, alt: study.image.alt || study.brand, sizes: photoSizes(study.image) },
  };
}

export default async function CaseStudiesPage() {
  const { source, items } = await getCaseStudies();
  // An empty list from the API is the editors' call, so it is not papered over
  // with the hardcoded studies; only an unreachable API is.
  const cards = source === "fallback" ? FALLBACK_CARDS : items.map(toCard);

  return (
    <div className="bg-canvas text-white">
      <PageHero title="Case Studies" tag="Results" sub="Real campaigns. Real results. See how Tanzania's leading brands have used Ashton Media's network to drive measurable impact." />

      <div className="max-w-300 mx-auto py-15 px-(--gutter) md:px-6 lg:px-8">
        {cards.length === 0 ? (
          <div className="bg-card border border-white/7 rounded-xl py-14 px-6 mb-15 text-center">
            <h2 className="font-black text-[20px] sm:text-[24px] lg:text-[28px] mb-3 tracking-[-0.5px] leading-[1.2]">New case studies are on the way.</h2>
            <p className="text-sm text-white/50 leading-[1.75] max-w-105 mx-auto">
              We&apos;re updating this page. In the meantime, tell us about your campaign and we&apos;ll share results from similar work.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10 mb-15">
            {cards.map((card, i) => (
              <div
                key={card.key}
                className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-card border border-white/7 rounded-xl overflow-hidden"
              >
                {i % 2 !== 0 && <CaseStudyContent card={card} />}
                {/* On phones the card stacks and the photo always leads; from md up it alternates sides. */}
                <PhotoPlaceholder ratio="4/3" overlay label={card.brand} className="order-first md:order-none" {...card.photo} />
                {i % 2 === 0 && <CaseStudyContent card={card} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <CTABlock />
    </div>
  );
}

// min-w-0 and wrap-break-word keep an editor's long brand, headline or
// unbroken string inside its half of the card.
function CaseStudyContent({ card }: { card: Card }) {
  return (
    <div className="py-6 px-5 md:py-10 md:px-12 flex flex-col justify-center min-w-0 wrap-break-word">
      {card.badge && <div className="mb-3"><FormatBadge format={card.badge.format} label={card.badge.label} wrapOnMobile={Boolean(card.badge.label)} /></div>}
      <div className="text-xs font-semibold text-white/35 mb-2">{card.brand}</div>
      <h2 className="font-black text-[20px] sm:text-[24px] lg:text-[28px] mb-4 tracking-[-0.5px] leading-[1.2]">{card.headline}</h2>
      <p className={`text-sm text-white/50 leading-[1.75] ${card.metrics.length > 0 ? "mb-7" : ""}`}>{card.description}</p>
      {card.metrics.length > 0 && (
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {card.metrics.map((m, index) => (
            <div key={index} className="min-w-0">
              <div className="font-black text-[28px] tracking-[-1px]">{m.value}</div>
              <div className="text-[12px] md:text-[11px] font-semibold tracking-[1.5px] uppercase text-white/30 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
