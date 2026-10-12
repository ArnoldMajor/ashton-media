import { PageHero } from "@/components/PageSections";
import CTABlock from "@/components/CTABlock";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import BillboardCard from "@/components/BillboardCard";
import { getBillboardsByFormat } from "@/lib/api/billboards";
import { getSiteContent, slotImage } from "@/lib/api/site-content";
import Link from "next/link";

const ADVANTAGES = [
  { stat: "4K", label: "Resolution", desc: "Crystal-clear displays visible from 200m+ in full daylight." },
  { stat: "24/7", label: "Always On", desc: "Full brightness guaranteed day and night, rain or shine." },
  { stat: "10s", label: "Slot Rotation", desc: "Share the screen in a rotation — more affordable, same impact." },
  { stat: "1hr", label: "Content Change", desc: "Update your creative in hours, not days — react to events in real time." },
];

const SCHEDULE = [
  ["Morning (6–9 AM)", "Commuter traffic"],
  ["Lunch (12–2 PM)", "CBD footfall peak"],
  ["Evening (5–8 PM)", "Highest vehicle volume"],
  ["Weekend All-Day", "Mall & leisure traffic"],
];

export default async function DigitalPage() {
  const [byFormat, content] = await Promise.all([getBillboardsByFormat(), getSiteContent()]);
  const digitalSites = byFormat.digital;
  // Set in the admin (Site Images). Until it is, the banner keeps its stock photo.
  const banner = slotImage(content, "digital.banner");

  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Digital Out-of-Home"
        tag="LED Screens"
        sub="20 high-resolution LED screens across Tanzania's highest-traffic corridors. Dynamic content, real-time scheduling, and verified traffic data."
      />

      <div className="max-w-300 mx-auto py-15 px-(--gutter) md:px-6 lg:px-8">

        <div className="rounded-xl overflow-hidden mb-15 border border-accent/15">
          <PhotoPlaceholder ratio="21/9" overlay label="Digital LED Screen — New Bagamoyo Road" photoIndex={0} src={banner?.url} alt={banner?.alt || undefined} sizes="(max-width: 1200px) 100vw, 1136px" />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-15">
          {ADVANTAGES.map((f) => (
            <div key={f.label} className="bg-card border border-accent/10 rounded-[10px] py-7 px-6">
              <div className="font-black text-4xl text-accent mb-1 tracking-[-1px]">{f.stat}</div>
              <div className="text-[12px] md:text-[11px] font-bold tracking-[2px] uppercase text-accent/60 mb-3">{f.label}</div>
              <p className="text-[13px] text-white/40 leading-[1.65]">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-white/8 rounded-xl py-6 px-5 md:py-10 md:px-12 mb-15 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <div className="text-[12px] md:text-[11px] font-semibold tracking-[3px] text-accent/60 uppercase mb-3">Smart Scheduling</div>
            <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-4 tracking-[-1px]">Right Message,<br />Right Time</h2>
            <p className="text-sm text-white/45 leading-[1.75]">
              Schedule your ads by time of day. Morning commute? Evening rush? Weekend crowd? Target your audience at peak attention moments.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {SCHEDULE.map(([t, l]) => (
              <div key={t} className="flex justify-between py-3 px-4 bg-white/3 rounded-lg border border-white/6">
                <span className="text-[13px] font-semibold">{t}</span>
                <span className="text-xs text-white/35">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {digitalSites.length > 0 && (
          <>
        <h2 className="font-black text-[22px] sm:text-[28px] lg:text-[36px] mb-6 tracking-[-1px]">Digital Screens</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-15">
          {digitalSites.map((site) => (
            <Link key={site.id} href="/gallery" className="block bg-card border border-accent/10 rounded-[10px] overflow-hidden no-underline text-white">
              <BillboardCard billboard={site} showBadge={false} />
            </Link>
          ))}
        </div>
          </>
        )}

      </div>

      <CTABlock />
    </div>
  );
}
