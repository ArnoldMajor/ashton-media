import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";

const STEPS = [
  { n: "01", title: "Brief", summary: "Objective, place, dates, rough budget.", detail: "Your objective, where you want to be seen, when, and a rough budget. Two minutes is enough." },
  { n: "02", title: "Plan", summary: "Sites and screens that fit.", detail: "We come back with sites and screens that fit, with photos and locations." },
  { n: "03", title: "Quote", summary: "One quote for the whole campaign.", detail: "One quote for the whole campaign. Print and installation included." },
  { n: "04", title: "Artwork", summary: "Yours or ours, checked against each site.", detail: "Send your artwork or we design it. We check it against each site's specs." },
  { n: "05", title: "Live", summary: "Posted, scheduled, confirmed.", detail: "Static sites are posted and digital creative is scheduled. You get confirmation." },
  { n: "06", title: "Report", summary: "Proof of posting and proof of play.", detail: "Proof of posting, and proof of play for digital." },
];

const INCLUDES = [
  {
    title: "What a static booking includes",
    items: ["The site for the period", "Printing to spec", "Installation and posting", "A photograph of the posted site"],
  },
  {
    title: "What a digital booking includes",
    items: ["A share of the loop on each screen", "Scheduling, including day-parting", "Creative changes during the campaign", "Proof of play"],
  },
];

interface Props {
  /** "condensed" is the homepage teaser: the six steps and a link to the full page. */
  variant?: "full" | "condensed";
}

export default function CampaignProcess({ variant = "full" }: Props) {
  const condensed = variant === "condensed";

  return (
    <section className="bg-canvas text-white py-15 sm:py-18 md:py-22 lg:py-25 px-(--gutter) md:px-6 lg:px-8">
      <div className="max-w-300 mx-auto">
        <div className="flex justify-between items-end flex-wrap gap-x-10 gap-y-5 mb-9 sm:mb-12">
          <div>
            <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-white/40 uppercase mb-4">How it works</div>
            <SectionHeading lead="From brief" accent="to proof it ran." className="text-[26px] sm:text-[36px] lg:text-[46px] tracking-[-1.5px] leading-[1.08]" />
          </div>
          {condensed && (
            <Link href="/plan-a-campaign" className="inline-flex items-center text-[13px] font-semibold text-accent no-underline hover:text-accent/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              See how a campaign runs →
            </Link>
          )}
        </div>

        {/* A vertical timeline on mobile, a 3×2 grid of cards on desktop. */}
        <ol className="grid lg:grid-cols-3 lg:gap-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="relative pl-9 pb-3 last:pb-0 lg:pl-0 lg:pb-0 before:absolute before:left-1.75 before:top-7 before:bottom-0 before:w-px before:bg-white/10 last:before:hidden lg:before:hidden"
            >
              <span aria-hidden className="absolute left-0 top-7 size-3.75 rounded-full border border-accent bg-canvas lg:hidden" />
              <div className="relative h-full overflow-hidden bg-card border border-white/7 rounded-[10px] py-5 sm:py-6 lg:py-7 px-5 lg:px-6">
                <div aria-hidden className="absolute -top-1 right-3 font-extrabold text-[64px] lg:text-[88px] leading-none tracking-[-2px] text-white/7 select-none">
                  {step.n}
                </div>
                <div className={`relative ${condensed ? "" : "lg:pt-10"}`}>
                  <h3 className="font-bold text-base lg:text-lg mb-1.75">{step.title}</h3>
                  <p className={`text-[13px] text-white/45 leading-[1.65] ${condensed ? "max-w-50" : "max-w-80"}`}>{condensed ? step.summary : step.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!condensed && (
          <>
            <div className="grid md:grid-cols-2 gap-3 mt-12 sm:mt-15">
              {INCLUDES.map((group) => (
                <div key={group.title} className="border border-white/10 rounded-[10px] py-6 lg:py-8 px-5 lg:px-7">
                  <h3 className="font-bold text-base lg:text-lg mb-5">{group.title}</h3>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-white/65 leading-normal">
                        <svg aria-hidden className="shrink-0 mt-1 text-accent" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7.5l3.2 3.2L12 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-white/35 mt-5">Creative design and special builds are quoted separately.</p>
          </>
        )}
      </div>
    </section>
  );
}
