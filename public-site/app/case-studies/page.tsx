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
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero title="Case Studies" tag="Results" sub="Real campaigns. Real results. See how Tanzania's leading brands have used Ashton Media's network to drive measurable impact." />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "60px" }}>
          {CASE_STUDIES.map((cs, i) => (
            <div
              key={cs.brand}
              style={{ display: "grid", gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr", gap: "0", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}
            >
              {i % 2 !== 0 && (
                <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <CaseStudyContent cs={cs} />
                </div>
              )}
              <PhotoPlaceholder ratio="4/3" overlay label={cs.brand} photoIndex={cs.photoIndex} />
              {i % 2 === 0 && (
                <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
      <div style={{ marginBottom: "12px" }}><FormatBadge type={cs.type} /></div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--white-subtle)", marginBottom: "8px" }}>{cs.brand}</div>
      <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(20px,2.5vw,28px)", margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{cs.headline}</h2>
      <p style={{ fontSize: "14px", color: "var(--white-moderate)", lineHeight: 1.75, margin: "0 0 28px" }}>{cs.desc}</p>
      <div style={{ display: "flex", gap: "32px" }}>
        {[cs.metric1, cs.metric2].map((m) => (
          <div key={m.l}>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-1px" }}>{m.n}</div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-subdued)", marginTop: "4px" }}>{m.l}</div>
          </div>
        ))}
      </div>
    </>
  );
}
