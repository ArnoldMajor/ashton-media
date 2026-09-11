import { PageHero } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import FormatBadge from "@/components/FormatBadge";

const POSTS = [
  { category: "digital" as const, title: "Why Digital OOH Outperforms Static in High-Traffic Corridors", date: "Apr 2025", read: "5 min", desc: "New data from our Dar es Salaam screens shows dynamic creative generates 3× more recall than static equivalents at the same location.", photoIndex: 0 },
  { category: "traditional" as const, title: "The Billboard Location Intelligence Report: Tanzania 2025", date: "Mar 2025", read: "8 min", desc: "We analysed 500+ sites to rank Tanzania's most valuable OOH positions by traffic volume, demographic quality, and advertiser ROI.", photoIndex: 4 },
  { category: "airport" as const, title: "Airport Advertising ROI: What 12 Months of Data Tells Us", date: "Feb 2025", read: "6 min", desc: "A year of campaign data from JNIA Terminal 3 reveals surprising patterns about advertiser performance and audience behaviour.", photoIndex: 3 },
  { category: "digital" as const, title: "Time of Day Targeting: The New Frontier of OOH", date: "Jan 2025", read: "4 min", desc: "How smart scheduling on digital screens is closing the gap between OOH and digital channel targeting capabilities.", photoIndex: 1 },
  { category: "traditional" as const, title: "Choosing the Right Billboard Size for Your Campaign", date: "Dec 2024", read: "3 min", desc: "A practical guide to format selection — when to go large with a gantry and when a standard panel delivers better value.", photoIndex: 5 },
  { category: "traditional" as const, title: "OOH Advertising in East Africa: 2025 Outlook", date: "Nov 2024", read: "7 min", desc: "The OOH market in Tanzania and East Africa is growing fast. Here's where the opportunity lies and how to capture it.", photoIndex: 2 },
];

export default function BlogPage() {
  return (
    <div className="bg-canvas text-white">
      <PageHero title="Insights & News" tag="Blog" sub="Industry analysis, campaign data, and OOH advertising insights from Tanzania's leading media company." />

      <div className="max-w-300 mx-auto py-15 px-2.5 sm:px-4 md:px-6 lg:px-8">

        <div className="mb-12 bg-card border border-white/7 rounded-xl overflow-hidden grid grid-cols-2">
          <PhotoPlaceholder ratio="4/3" overlay photoIndex={POSTS[0].photoIndex} />
          <div className="py-10 px-12 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <FormatBadge type={POSTS[0].category} small />
              <span className="text-xs text-white/35">{POSTS[0].date} · {POSTS[0].read} read</span>
            </div>
            <h2 className="font-black text-[18px] sm:text-[22px] lg:text-[26px] mb-4 tracking-[-0.5px] leading-[1.2]">{POSTS[0].title}</h2>
            <p className="text-sm text-white/45 leading-[1.75]">{POSTS[0].desc}</p>
            <div className="mt-6 text-[13px] font-bold text-white/50">Read article →</div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {POSTS.slice(1).map((post) => (
            <div
              key={post.title}
              className="bg-card border border-white/7 rounded-[10px] overflow-hidden cursor-pointer transition-colors hover:border-white/18"
            >
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={post.photoIndex} />
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <FormatBadge type={post.category} small />
                  <span className="text-[11px] text-white/30">{post.date} · {post.read}</span>
                </div>
                <h3 className="font-bold text-[15px] mb-2 leading-[1.35] tracking-[-0.3px]">{post.title}</h3>
                <p className="text-[13px] text-white/40 leading-[1.6]">{post.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
