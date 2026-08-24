import { PageHero, CTABar } from "@/components/PageSections";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { SITES } from "@/lib/data";
import Link from "next/link";

export default function AirportPage() {
  const airportSites = SITES.filter((s) => s.type === "airport");

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>
      <PageHero
        title="Airport Advertising"
        tag="JNIA Terminal 3"
        sub="Exclusive advertising rights at Julius Nyerere International Airport Terminal 3 — Tanzania's gateway to the world."
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>

        <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "60px" }}>
          <PhotoPlaceholder ratio="21/9" overlay label="JNIA Terminal 3" photoIndex={3} />
        </div>

        {/* Why airport */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,80px)", marginBottom: "60px", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "12px" }}>Why Airport</div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(24px,3.5vw,44px)", margin: "0 0 20px", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
              Captive. Premium.<br/>Unmatched.
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.8, margin: "0 0 24px" }}>
              Airport audiences are uniquely captive — they dwell for an average of 90 minutes. They're high-income, decision-making professionals. And they're already primed to notice.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                ["8,000+", "daily passengers"],
                ["90 min", "average dwell time"],
                ["65%", "business travellers"],
                ["12+", "advertising positions"],
              ].map(([n, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "24px", letterSpacing: "-1px", minWidth: "80px" }}>{n}</div>
                  <div style={{ fontSize: "13px", color: "var(--white-quiet)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { title: "Check-In Hall", desc: "Large-format backlit panels above all check-in desks — 100% passenger coverage." },
              { title: "Departure Lounge", desc: "Premium digital screens and print panels throughout the seating and retail area." },
              { title: "Baggage Reclaim", desc: "Captive audience of arriving passengers with long dwell times — ideal for brand recall." },
              { title: "Escalators & Walkways", desc: "Sequential panels that build a narrative as travellers move through the terminal." },
            ].map((f) => (
              <div key={f.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px 24px" }}>
                <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 6px" }}>{f.title}</h4>
                <p style={{ fontSize: "13px", color: "var(--white-quiet)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Airport sites */}
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "0 0 24px", letterSpacing: "-1px" }}>Airport Positions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "60px" }}>
          {airportSites.map((site) => (
            <Link key={site.id} href="/gallery" style={{ display: "block", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", textDecoration: "none", color: "var(--text)" }}>
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
              <div style={{ padding: "16px" }}>
                <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 8px" }}>{site.name}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--white-subtle)" }}>
                  <span>{site.rate}/mo</span>
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
