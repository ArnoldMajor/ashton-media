"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import TanzaniaMap from "@/components/TanzaniaMap";
import SiteModal from "@/components/SiteModal";
import FormatBadge from "@/components/FormatBadge";
import { SITES, Site } from "@/lib/data";

const HERO_SLIDES = [
  { tag: "Out-of-Home Advertising", headline: "Make Your\nBrand\nUnmissable.", sub: "Tanzania's largest OOH network — 500+ sites across roads, malls, bus stands and airports.", photoIndex: 4 },
  { tag: "Digital Out-of-Home", headline: "Dynamic.\nBold.\nAlways On.", sub: "20 high-resolution LED screens across Tanzania's highest-traffic corridors.", photoIndex: 0 },
  { tag: "Airport Advertising", headline: "Own the\nAirport\nExperience.", sub: "Exclusive advertising rights across Julius Nyerere International Airport Terminal 3.", photoIndex: 3 },
];

const STAT_TARGETS = [500, 20, 8, 2005];
const STAT_LABELS = ["Billboard Sites", "LED Screens", "Cities Covered", "Est. Year"];
const STAT_SUFFIX = ["+", "", "", ""];

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [countVisible, setCountVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % 3), 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setCountVisible(true); }, { threshold: 0.3 });
    if (countRef.current) obs.observe(countRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!countVisible) return;
    STAT_TARGETS.forEach((end, idx) => {
      let val = 0; const step = end / 55;
      const id = setInterval(() => {
        val += step;
        if (val >= end) { val = end; clearInterval(id); }
        setCounts((prev) => { const n = [...prev]; n[idx] = Math.floor(val); return n; });
      }, 18);
    });
  }, [countVisible]);

  const slide = HERO_SLIDES[heroIdx];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat',sans-serif" }}>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {HERO_SLIDES.map((s, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: heroIdx === i ? 1 : 0, transition: "opacity 1s ease" }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <PhotoPlaceholder ratio="1/1" overlay={false} photoIndex={s.photoIndex} fill />
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--black-scrim) 0%, var(--black-medium) 55%, var(--black-soft) 100%)" }} />
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(100px,12vw,160px) clamp(20px,5vw,64px) 80px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ maxWidth: "min(560px, 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
              <div style={{ width: "24px", height: "1px", background: "var(--text-muted)" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-moderate)", textTransform: "uppercase" }}>{slide.tag}</span>
            </div>
            <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(44px,7vw,88px)", lineHeight: 1.0, margin: "0 0 24px", letterSpacing: "-2px", whiteSpace: "pre-line" }}>{slide.headline}</h1>
            <p style={{ fontSize: "clamp(14px,1.8vw,17px)", fontWeight: 400, color: "var(--white-medium)", lineHeight: 1.75, margin: "0 0 40px", maxWidth: "420px" }}>{slide.sub}</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "60px" }}>
              <Link href="/contact" style={{ background: "var(--text)", color: "var(--on-accent)", fontSize: "13px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "14px clamp(20px,3vw,28px)", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Start a Campaign</Link>
              <Link href="/gallery" style={{ background: "transparent", border: "1px solid var(--white-subdued)", color: "var(--white-strong)", fontSize: "13px", fontWeight: 600, fontFamily: "'Montserrat',sans-serif", padding: "14px clamp(20px,3vw,28px)", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>View Locations →</Link>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[0,1,2].map((i) => (
                <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? "28px" : "8px", height: "4px", borderRadius: "2px", border: "none", cursor: "pointer", background: i === heroIdx ? "var(--text)" : "var(--white-muted-label)", padding: 0, transition: "all 0.35s", minHeight: "unset" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={countRef} style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--white-faint)", borderBottom: "1px solid var(--white-faint)", padding: "56px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "32px" }}>
          {counts.map((count, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(36px,5vw,56px)", letterSpacing: "-2px", lineHeight: 1 }}>{count}{STAT_SUFFIX[i]}</div>
              <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "2px", color: "var(--white-subtle)", textTransform: "uppercase", marginTop: "8px" }}>{STAT_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTIONS */}
      <section style={{ padding: "clamp(60px,8vw,100px) clamp(20px,5vw,64px)", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(36px,5vw,56px)" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "12px" }}>Our Solutions</div>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(28px,4.5vw,52px)", letterSpacing: "-1.5px", lineHeight: 1.05, margin: 0 }}>Every Format.<br/>Every Location.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {[
            { type: "traditional" as const, title: "Traditional OOH", desc: "Static and illuminated billboards at Tanzania's busiest roads, intersections, and malls.", href: "/traditional", photoIndex: 4 },
            { type: "digital" as const, title: "Digital OOH", desc: "20 high-resolution LED screens with dynamic content, real-time scheduling, and traffic data.", href: "/digital", photoIndex: 0 },
            { type: "airport" as const, title: "Airport Advertising", desc: "Premium placements inside Julius Nyerere International Airport Terminal 3.", href: "/airport", photoIndex: 3 },
          ].map((s) => (
            <Link key={s.href} href={s.href} style={{ display: "block", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", textDecoration: "none", color: "var(--text)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--white-pale)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
              <PhotoPlaceholder ratio="16/9" overlay photoIndex={s.photoIndex} />
              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: "10px" }}><FormatBadge type={s.type} /></div>
                <h3 style={{ fontWeight: 800, fontSize: "17px", margin: "0 0 8px", letterSpacing: "-0.5px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--white-quiet)", lineHeight: 1.65, margin: "0 0 16px" }}>{s.desc}</p>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--white-moderate)" }}>Explore →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MAP + COVERAGE */}
      <section style={{ padding: "clamp(60px,8vw,100px) clamp(20px,5vw,64px)", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(40px,6vw,80px)", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "12px" }}>Coverage</div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(26px,4vw,48px)", margin: "0 0 20px", letterSpacing: "-1.5px", lineHeight: 1.05 }}>Nationwide<br/>Network</h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.8, margin: "0 0 32px", maxWidth: "380px" }}>From Dar es Salaam to Arusha, Mwanza to Dodoma — Ashton Media covers Tanzania's most important markets.</p>
            <div style={{ borderTop: "1px solid var(--white-hushed)" }}>
              {[{city:"Dar es Salaam",count:"300+ sites — digital, traditional, airport"},{city:"Arusha",count:"60+ traditional + digital"},{city:"Mwanza",count:"40+ traditional"},{city:"Dodoma",count:"25+ traditional"},{city:"Mbeya",count:"15+ traditional"}].map((loc) => (
                <div key={loc.city} style={{ padding: "14px 0", borderBottom: "1px solid var(--white-faint)", display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>{loc.city}</span>
                  <span style={{ fontSize: "12px", color: "var(--white-subtle)" }}>{loc.count}</span>
                </div>
              ))}
            </div>
            <Link href="/gallery" style={{ display: "inline-block", marginTop: "28px", background: "var(--text)", color: "var(--on-accent)", fontSize: "13px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "13px 26px", borderRadius: "6px", textDecoration: "none" }}>Explore All Locations</Link>
          </div>
          <Link href="/gallery" style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--white-hushed)", padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textDecoration: "none" }}>
            <TanzaniaMap />
          </Link>
        </div>
      </section>

      {/* WHY ASHTON */}
      <section style={{ padding: "clamp(60px,8vw,100px) clamp(20px,5vw,64px)", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(40px,6vw,80px)", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "12px" }}>Why Choose Us</div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(26px,4vw,48px)", margin: "0 0 20px", letterSpacing: "-1.5px", lineHeight: 1.05 }}>Tanzania's #1<br/>OOH Company</h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.8, margin: "0 0 32px", maxWidth: "380px" }}>Founded in 2005, Ashton Media has built Tanzania's most comprehensive out-of-home network — award-winning creative, strategy and execution under one roof.</p>
            <Link href="/contact" style={{ display: "inline-block", background: "var(--text)", color: "var(--on-accent)", fontSize: "13px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "13px 26px", borderRadius: "6px", textDecoration: "none" }}>Request a Proposal</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[{n:"01",title:"Market Leader",desc:"Ranked #1 OOH company in Tanzania by reach, inventory and client satisfaction."},{n:"02",title:"Premium Locations",desc:"Strategic sites on major highways, intersections, malls and airports."},{n:"03",title:"In-House Creative",desc:"Full creative studio for campaign design and production — one partner, end to end."},{n:"04",title:"Verified Data",desc:"Traffic counts at every site so you know your campaign's reach and ROI."}].map((f) => (
              <div key={f.n} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "clamp(18px,2.5vw,28px) clamp(16px,2vw,24px)" }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "28px", color: "var(--border)", marginBottom: "14px", letterSpacing: "-1px" }}>{f.n}</div>
                <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 7px" }}>{f.title}</h4>
                <p style={{ fontSize: "13px", color: "var(--white-gentle)", margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVAILABLE SITES */}
      <section style={{ padding: "clamp(60px,8vw,100px) clamp(20px,5vw,64px)", background: "var(--bg-raised)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "10px" }}>Inventory</div>
              <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1.5px", lineHeight: 1.05, margin: 0 }}>Available Now</h2>
            </div>
            <Link href="/gallery" style={{ fontSize: "13px", fontWeight: 600, color: "var(--white-moderate)", textDecoration: "none" }}>View all sites →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {SITES.filter((s) => s.available).slice(0, 3).map((site) => (
              <button key={site.id} onClick={() => setSelectedSite(site)} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", textAlign: "left", cursor: "pointer", color: "var(--text)", width: "100%", padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--white-pale)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <FormatBadge type={site.type} small />
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--lime)" }}>Available</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 4px", letterSpacing: "-0.3px" }}>{site.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--white-subtle)", margin: "0 0 12px" }}>{site.city}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--white-subtle)" }}>
                    <span>{site.traffic}</span>
                    <span style={{ fontWeight: 700, color: "var(--white-secondary)" }}>{site.rate}/mo</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section style={{ padding: "56px clamp(20px,5vw,64px)", borderTop: "1px solid var(--white-faint)", background: "var(--bg-raised)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-dimmer)", textTransform: "uppercase", marginBottom: "32px" }}>Trusted by Tanzania's leading brands</p>
          <div style={{ display: "flex", gap: "clamp(24px,4vw,56px)", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
            {["Vodacom","Airtel","CRDB Bank","Azam","NMB Bank","TBL","Coca-Cola"].map((b) => (
              <span key={b} style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: "clamp(12px,1.4vw,14px)", color: "var(--white-pale)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--white-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--white-pale)")}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "clamp(80px,10vw,120px) clamp(20px,5vw,64px)", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(32px,5vw,64px)", margin: "0 0 18px", letterSpacing: "-2px", lineHeight: 1.0 }}>Ready to get<br/>noticed?</h2>
          <p style={{ fontSize: "16px", color: "var(--white-quiet)", margin: "0 0 36px", lineHeight: 1.7 }}>Talk to our team about locations, pricing and creative options.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" style={{ background: "var(--text)", color: "var(--on-accent)", fontSize: "14px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "15px clamp(24px,4vw,36px)", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Start a Campaign</Link>
            <a href="tel:+255758880088" style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--white-dim)", color: "var(--white-semi)", textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: "'Montserrat',sans-serif", padding: "15px clamp(24px,4vw,36px)", borderRadius: "6px" }}>+255 758 88 00 88</a>
          </div>
        </div>
      </section>

      {selectedSite && <SiteModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );
}
