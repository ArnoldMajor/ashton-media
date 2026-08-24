// No "use client" — this is a Server Component.
// It renders to static HTML, zero JS sent to the browser.
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-footer)",
        borderTop: "1px solid var(--border)",
        padding: "72px clamp(20px,5vw,64px) 40px",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "40px",
            marginBottom: "56px",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "0.5px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="5" fill="var(--text)" />
                <text x="14" y="20" textAnchor="middle" fill="var(--on-accent)" fontSize="13" fontWeight="900" fontFamily="Montserrat,sans-serif">
                  A
                </text>
              </svg>
              ASHTON MEDIA
            </div>
            <p style={{ fontSize: "13px", color: "var(--white-subtle)", lineHeight: 1.7, maxWidth: "200px" }}>
              Tanzania's #1 out-of-home advertising network since 2005.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "var(--white-muted-label)", textTransform: "uppercase", marginBottom: "16px" }}>
              Solutions
            </div>
            {[
              { label: "Traditional OOH", href: "/traditional" },
              { label: "Digital OOH", href: "/digital" },
              { label: "Airport Advertising", href: "/airport" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "var(--white-muted-label)", textTransform: "uppercase", marginBottom: "16px" }}>
              Company
            </div>
            {[
              { label: "Gallery", href: "/gallery" },
              { label: "Case Studies", href: "/case-studies" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "10px" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "var(--white-muted-label)", textTransform: "uppercase", marginBottom: "16px" }}>
              Get in Touch
            </div>
            <a href="tel:+255758880088" style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "10px" }}>
              +255 758 88 00 88
            </a>
            <a href="mailto:info@ashtonmedia.net" style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "10px" }}>
              info@ashtonmedia.net
            </a>
            <p style={{ fontSize: "13px", color: "var(--white-subtle)", lineHeight: 1.6, marginTop: "8px" }}>
              Dar es Salaam<br />Tanzania
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--white-faint)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--white-dim)" }}>
            © {new Date().getFullYear()} Ashton Media Ltd. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service"].map((t) => (
              <span key={t} style={{ fontSize: "12px", color: "var(--white-dim)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
