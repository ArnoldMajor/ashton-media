import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import FormatBadge from "@/components/FormatBadge";

const CASE_STUDIES = [
  { brand: "Vodacom Tanzania", type: "digital" as const, headline: "15M+ Impressions in 30 Days", desc: "A 4-screen digital network campaign across Dar es Salaam's CBD drove brand recall up 38% among the target demographic.", metric1: { n: "15M+", l: "impressions" }, metric2: { n: "38%", l: "recall lift" }, photoIndex: 0 },
  { brand: "CRDB Bank", type: "traditional" as const, headline: "Full-City Saturation Launch", desc: "20-billboard roadside takeover across Dar es Salaam to support a new product launch — campaign reached 2.4M people over 8 weeks.", metric1: { n: "2.4M", l: "reach" }, metric2: { n: "8 wks", l: "duration" }, photoIndex: 4 },
  { brand: "Azam FC", type: "airport" as const, headline: "Terminal 3 Sponsorship", desc: "Season-long airport takeover targeting arriving business travellers, positioning Azam as Tanzania's premium brand.", metric1: { n: "12", l: "positions" }, metric2: { n: "365d", l: "campaign" }, photoIndex: 3 },
  { brand: "Airtel Tanzania", type: "digital" as const, headline: "Dynamic Daypart Campaign", desc: "Time-of-day targeted content on 8 LED screens — morning commute messages drove 24% higher response rate vs. static creative.", metric1: { n: "24%", l: "higher CTR" }, metric2: { n: "8", l: "screens" }, photoIndex: 1 },
];

export default function CaseStudiesPage() {
  return (
    <div className="bg-canvas text-white">
      <PageHero title="Case Studies" tag="Results" sub="Real campaigns. Real results. See how Tanzania's leading brands have used Ashton Media's network to drive measurable impact." />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-10 mb-15">
          {CASE_STUDIES.map((cs, i) => (
            <div
              key={cs.brand}
              className="grid grid-cols-2 gap-0 bg-card border border-white/7 rounded-xl overflow-hidden"
            >
              {i % 2 !== 0 && (
                <div className="py-10 px-12 flex flex-col justify-center">
                  <CaseStudyContent cs={cs} />
                </div>
              )}
              <PhotoPlaceholder ratio="4/3" overlay label={cs.brand} photoIndex={cs.photoIndex} />
              {i % 2 === 0 && (
                <div className="py-10 px-12 flex flex-col justify-center">
                  <CaseStudyContent cs={cs} />
                </div>
              )}
            </div>
          ))}
        </div>
        <CTABar />
      </div>
    </div>
  );
}

function CaseStudyContent({ cs }: { cs: typeof CASE_STUDIES[0] }) {
  return (
    <>
      <div className="mb-3"><FormatBadge type={cs.type} /></div>
      <div className="text-xs font-semibold text-white/35 mb-2">{cs.brand}</div>
      <h2 className="font-black text-[20px] sm:text-[24px] lg:text-[28px] mb-4 tracking-[-0.5px] leading-[1.2]">{cs.headline}</h2>
      <p className="text-sm text-white/50 leading-[1.75] mb-7">{cs.desc}</p>
      <div className="flex gap-8">
        {[cs.metric1, cs.metric2].map((m) => (
          <div key={m.l}>
            <div className="font-black text-[28px] tracking-[-1px]">{m.n}</div>
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-white/30 mt-1">{m.l}</div>
          </div>
        ))}
      </div>
    </>
  );
}
