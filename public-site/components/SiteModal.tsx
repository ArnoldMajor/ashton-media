"use client";
import { useEffect } from "react";
import { Site } from "@/lib/data";
import PhotoPlaceholder from "./PhotoPlaceholder";
import FormatBadge from "./FormatBadge";

interface Props {
  site: Site;
  onClose: () => void;
}

export default function SiteModal({ site, onClose }: Props) {
  const photoIdx = { digital: 1, airport: 3, traditional: 4 }[site.type] ?? 0;

  // Lock body scroll while modal is open — cleanup on unmount
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on backdrop click, not on modal content click (stopPropagation below)
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "var(--black-scrim)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-sheet)", border: "1px solid var(--white-soft)", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "680px", maxHeight: "92vh", overflowY: "auto", fontFamily: "'Montserrat',sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--white-light)" }} />
        </div>

        {/* Photo */}
        <div style={{ position: "relative" }}>
          <PhotoPlaceholder label={site.name} ratio="16/7" overlay photoIndex={photoIdx} />
          <button
            onClick={onClose}
            style={{ position: "absolute", top: "12px", right: "12px", background: "var(--black-strong)", border: "1px solid var(--white-light)", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", color: "var(--text)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "unset" }}
          >
            ×
          </button>
          <div style={{ position: "absolute", bottom: "12px", left: "16px" }}>
            <FormatBadge type={site.type} small />
          </div>
        </div>

        <div style={{ padding: "24px 20px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "20px", margin: "0 0 4px", letterSpacing: "-0.5px" }}>{site.name}</h2>
              <div style={{ fontSize: "13px", color: "var(--white-quiet)" }}>{site.city}, Tanzania</div>
            </div>
            <div style={{ background: site.available ? "var(--lime-wash)" : "var(--white-whisper)", border: `1px solid ${site.available ? "var(--lime-border)" : "var(--white-hushed)"}`, borderRadius: "8px", padding: "10px 16px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: site.available ? "var(--lime)" : "var(--white-subtle)" }}>
                {site.available ? "Available" : "Booked"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--white-subtle)", marginTop: "2px" }}>
                {site.available ? "From next month" : site.bookedUntil}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "20px" }}>
            {[
              { label: "Daily Traffic", value: site.traffic },
              { label: "Dimensions", value: site.size },
              { label: "Illuminated", value: site.illuminated ? "Yes" : "No" },
              { label: "Format", value: site.type.charAt(0).toUpperCase() + site.type.slice(1) },
              { label: "Faces", value: site.faces },
              { label: "Monthly Rate", value: site.rate },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--bg-stat)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-subdued)", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Weekly traffic bar chart */}
          <div style={{ background: "var(--bg-stat)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white-subdued)", marginBottom: "12px" }}>Weekly Traffic Pattern</div>
            <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "52px" }}>
              {[65, 80, 75, 90, 95, 70, 55].map((h, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "100%", background: i >= 5 ? "var(--white-mild)" : "var(--white-tertiary)", borderRadius: "2px 2px 0 0", height: `${h}%` }} />
                  <div style={{ fontSize: "9px", color: "var(--white-subdued)", fontWeight: 700 }}>{["M","T","W","T","F","S","S"][i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              style={{ background: "var(--text)", border: "none", cursor: "pointer", color: "var(--on-accent)", fontSize: "14px", fontWeight: 700, fontFamily: "'Montserrat',sans-serif", padding: "15px", borderRadius: "8px", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Book This Site
            </button>
            <button
              style={{ background: "transparent", border: "1px solid var(--white-pale)", cursor: "pointer", color: "var(--white-semi)", fontSize: "14px", fontWeight: 600, fontFamily: "'Montserrat',sans-serif", padding: "15px", borderRadius: "8px", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--white-quiet)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--white-pale)")}
            >
              Download Spec Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
