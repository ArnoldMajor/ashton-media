"use client";
import { useState } from "react";
import { SITES, Site } from "@/lib/data";
import { PageHero } from "@/components/PageSections";
import FormatBadge from "@/components/FormatBadge";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import SiteModal from "@/components/SiteModal";
import TanzaniaMap from "@/components/TanzaniaMap";

const FILTERS = [
  { key: "all",       label: "All Locations" },
  { key: "digital",   label: "Digital" },
  { key: "traditional", label: "Traditional" },
  { key: "airport",   label: "Airport" },
  { key: "available", label: "Available Now" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Site | null>(null);

  const filtered = SITES.filter((s) => {
    const matchType = filter === "all" ? true : filter === "available" ? s.available : s.type === filter;
    const matchSearch = search === "" ? true : s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Montserrat', sans-serif" }}>
      <PageHero
        title="Locations & Sites"
        tag="Billboard Gallery"
        sub="Browse our full inventory of premium billboard sites across Tanzania. Click any site to see availability, traffic data and pricing."
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px clamp(20px,5vw,64px)", boxSizing: "border-box" }}>
        {/* Filter controls */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap", alignItems: "center" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ background: filter === f.key ? "var(--text)" : "transparent", border: `1px solid ${filter === f.key ? "var(--text)" : "var(--white-light)"}`, color: filter === f.key ? "var(--on-accent)" : "var(--white-secondary)", padding: "9px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", cursor: "pointer", transition: "all 0.2s", minHeight: "unset" }}
            >
              {f.label}
            </button>
          ))}

          {/* Search */}
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              style={{ background: "var(--bg-card-alt)", border: "1px solid var(--white-mild)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", fontFamily: "'Montserrat',sans-serif", padding: "10px 16px 10px 36px", outline: "none", width: "220px" }}
            />
            <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.2" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--white-subdued)", marginBottom: "24px" }}>
          {filtered.length} {filtered.length === 1 ? "site" : "sites"} found
        </p>

        {/* Site grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "60px" }}>
          {filtered.map((site) => (
            <button
              key={site.id}
              onClick={() => setSelected(site)}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", textAlign: "left", cursor: "pointer", color: "var(--text)", width: "100%", padding: 0, transition: "border-color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--white-pale)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ position: "relative" }}>
                <PhotoPlaceholder ratio="16/9" overlay photoIndex={site.photoIndex} />
                {site.available && (
                  <div style={{ position: "absolute", top: "12px", right: "12px", background: "var(--lime-glow)", border: "1px solid var(--lime-border-strong)", borderRadius: "100px", padding: "3px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--lime)" }}>
                    Available
                  </div>
                )}
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ marginBottom: "10px" }}><FormatBadge type={site.type} small /></div>
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

        {/* Map section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase", marginBottom: "12px" }}>Map View</div>
            <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "0 0 16px", letterSpacing: "-1px" }}>Tanzania Coverage</h2>
            <p style={{ fontSize: "14px", color: "var(--white-quiet)", lineHeight: 1.7, maxWidth: "320px" }}>
              Yellow dots = Digital LED screens. White dots = Traditional billboards and airport sites. Bright dots = currently available.
            </p>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--white-hushed)", padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "320px" }}>
            <TanzaniaMap />
          </div>
        </div>
      </div>

      {selected && <SiteModal site={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
