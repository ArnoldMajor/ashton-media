"use client";
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
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero title="Insights & News" tag="Blog" sub="Industry analysis, campaign data, and OOH advertising insights from Tanzania's leading media company." />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>

        {/* Featured post */}
        <div style={{ marginBottom: "48px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <PhotoPlaceholder ratio="4/3" overlay photoIndex={POSTS[0].photoIndex} />
          <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <FormatBadge type={POSTS[0].category} small />
              <span style={{ fontSize: "12px", color: "var(--white-subtle)" }}>{POSTS[0].date} · {POSTS[0].read} read</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(18px,2.5vw,26px)", margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{POSTS[0].title}</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>{POSTS[0].desc}</p>
            <div style={{ marginTop: "24px", fontSize: "13px", fontWeight: 700, color: "var(--white-moderate)" }}>Read article →</div>
          </div>
        </div>

        {/* Post grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {POSTS.slice(1).map((post) => (
            <div key={post.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--white-pale)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={post.photoIndex} />
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <FormatBadge type={post.category} small />
                  <span style={{ fontSize: "11px", color: "var(--white-subdued)" }}>{post.date} · {post.read}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "15px", margin: "0 0 8px", lineHeight: 1.35, letterSpacing: "-0.3px" }}>{post.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--white-quiet)", lineHeight: 1.6, margin: 0 }}>{post.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
