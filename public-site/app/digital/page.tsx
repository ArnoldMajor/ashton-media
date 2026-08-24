import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { SITES } from "@/lib/data";
import Link from "next/link";

export default function DigitalPage() {
  const digitalSites = SITES.filter((s) => s.type === "digital");

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero
        title="Digital Out-of-Home"
        tag="LED Screens"
        sub="20 high-resolution LED screens across Tanzania's highest-traffic corridors. Dynamic content, real-time scheduling, and verified traffic data."
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>

        {/* Hero image with lime accent */}
        <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "60px", border: "1px solid var(--lime-glow)" }}>
          <PhotoPlaceholder ratio="21/9" overlay label="Digital LED Screen — New Bagamoyo Road" photoIndex={0} />
        </div>

        {/* Digital advantages */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "60px" }}>
          {[
            { stat: "4K", label: "Resolution", desc: "Crystal-clear displays visible from 200m+ in full daylight." },
            { stat: "24/7", label: "Always On", desc: "Full brightness guaranteed day and night, rain or shine." },
            { stat: "10s", label: "Slot Rotation", desc: "Share the screen in a rotation — more affordable, same impact." },
            { stat: "1hr", label: "Content Change", desc: "Update your creative in hours, not days — react to events in real time." },
          ].map((f) => (
            <div key={f.label} style={{ background: "var(--bg-card)", border: "1px solid var(--lime-glow-soft)", borderRadius: "10px", padding: "28px 24px" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "36px", color: "var(--lime)", marginBottom: "4px", letterSpacing: "-1px" }}>{f.stat}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--lime-label)", marginBottom: "12px" }}>{f.label}</div>
              <p style={{ fontSize: "13px", color: "var(--white-quiet)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Scheduling callout */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--white-hushed)", borderRadius: "12px", padding: "40px 48px", marginBottom: "60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--lime-label)", textTransform: "uppercase", marginBottom: "12px" }}>Smart Scheduling</div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "0 0 16px", letterSpacing: "-1px" }}>Right Message,<br />Right Time</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>
              Schedule your ads by time of day. Morning commute? Evening rush? Weekend crowd? Target your audience at peak attention moments.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[["Morning (6–9 AM)", "Commuter traffic"], ["Lunch (12–2 PM)", "CBD footfall peak"], ["Evening (5–8 PM)", "Highest vehicle volume"], ["Weekend All-Day", "Mall & leisure traffic"]].map(([t, l]) => (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--white-ghost)", borderRadius: "8px", border: "1px solid var(--white-faint)" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{t}</span>
                <span style={{ fontSize: "12px", color: "var(--white-subtle)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital site cards */}
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "0 0 24px", letterSpacing: "-1px" }}>Digital Screens</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "60px" }}>
          {digitalSites.map((site) => (
            <Link key={site.id} href="/gallery" style={{ display: "block", background: "var(--bg-card)", border: "1px solid var(--lime-glow-soft)", borderRadius: "10px", overflow: "hidden", textDecoration: "none", color: "var(--text)" }}>
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
              <div style={{ padding: "16px" }}>
                <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px" }}>{site.name}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--white-subtle)", marginTop: "8px" }}>
                  <span>{site.city} · {site.size} · {site.traffic}</span>
                  <span style={{ color: site.available ? "var(--lime)" : "var(--white-subdued)", fontWeight: 700 }}>{site.available ? "Available" : "Booked"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <CTABar />
      </div>
    </div>
  );
}
