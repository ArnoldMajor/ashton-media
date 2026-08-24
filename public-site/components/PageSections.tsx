// Server Components — shared layout sections used across inner pages

interface PageHeroProps {
  title: string;
  sub: string;
  tag: string;
}

export function PageHero({ title, sub, tag }: PageHeroProps) {
  return (
    <section
      style={{
        padding: "clamp(100px,12vw,160px) clamp(20px,5vw,64px) clamp(40px,5vw,72px)",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "28px", height: "1px", background: "var(--white-quiet)" }} />
          <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", color: "var(--white-quiet)", textTransform: "uppercase" }}>
            {tag}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(40px,5.5vw,76px)",
            margin: "0 0 20px",
            letterSpacing: "-2px",
            lineHeight: 1.0,
            color: "var(--text)",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: "17px", color: "var(--text-muted)", maxWidth: "540px", lineHeight: 1.75, margin: 0, fontWeight: 400 }}>
          {sub}
        </p>
      </div>
    </section>
  );
}

export function CTABar() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "10px",
        padding: "40px 48px",
        border: "1px solid var(--white-hushed)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "40px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "22px", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
          Ready to launch your campaign?
        </h3>
        <p style={{ fontSize: "14px", color: "var(--white-quiet)", margin: 0 }}>
          Our team will build the perfect package for your brand and budget.
        </p>
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a
          href="tel:+255758880088"
          style={{ fontSize: "14px", fontWeight: 600, color: "var(--white-secondary)", textDecoration: "none", padding: "12px 24px", border: "1px solid var(--white-light)", borderRadius: "6px", fontFamily: "'Montserrat', sans-serif" }}
        >
          +255 758 88 00 88
        </a>
      </div>
    </div>
  );
}
