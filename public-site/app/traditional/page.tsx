import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { SITES } from "@/lib/data";
import Link from "next/link";

// Server Component — all data is known at build time, no interactivity needed.
export default function TraditionalPage() {
  const traditionalSites = SITES.filter((s) => s.type === "traditional");

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero
        title="Traditional Out-of-Home"
        tag="Static Billboards"
        sub="From roadside gantries to mall façades — our traditional OOH network delivers unbeatable reach across Tanzania's highest-traffic corridors."
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>

        {/* Hero image */}
        <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "60px" }}>
          <PhotoPlaceholder ratio="21/9" overlay label="Traditional Billboard — Morogoro Road" photoIndex={4} />
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "60px" }}>
          {[
            { icon: "📍", title: "Prime Locations", desc: "Strategically selected sites at Tanzania's most valuable intersections, highways, and commercial areas." },
            { icon: "💡", title: "Full Illumination", desc: "Most sites are illuminated for 24/7 impact — your message works around the clock." },
            { icon: "📐", title: "Large Formats", desc: "Standard 12×4m and premium 18×6m gantry formats for maximum visual impact." },
            { icon: "📊", title: "Traffic Verified", desc: "Independent traffic counts at every location so you can plan campaigns with confidence." },
          ].map((f) => (
            <div key={f.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "28px 24px" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: "15px", margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", color: "var(--white-quiet)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Site list */}
        <div style={{ marginBottom: "60px" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "0 0 24px", letterSpacing: "-1px" }}>Traditional Sites</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {traditionalSites.map((site) => (
              <Link
                key={site.id}
                href="/gallery"
                style={{ display: "block", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", textDecoration: "none", color: "var(--text)" }}
              >
                <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
                <div style={{ padding: "16px" }}>
                  <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px" }}>{site.name}</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--white-subtle)", marginTop: "8px" }}>
                    <span>{site.city} · {site.size}</span>
                    <span style={{ color: site.available ? "var(--lime)" : "var(--white-subdued)" }}>{site.available ? "Available" : "Booked"}</span>
                  </div>
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
