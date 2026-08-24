"use client";
// ☝️ This directive tells Next.js this is a Client Component.
// Why? Because it uses useState, useEffect, and event listeners —
// all browser-only APIs that can't run on the server.
// Server Components (no directive) render to HTML on the server — faster, no JS shipped.

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Next.js <Link> is like <a> but does client-side navigation (no full page reload).
// usePathname() gives us the current URL path so we can highlight the active link.

const SOLUTIONS = [
  { label: "Traditional OOH", href: "/traditional" },
  { label: "Digital OOH", href: "/digital" },
  { label: "Airport Advertising", href: "/airport" },
];

const LINKS = [
  { label: "Gallery", href: "/gallery" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  // Passive scroll listener — using IntersectionObserver is better for perf
  // but for a simple header effect a scroll listener on the window is fine here.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setSolutionsOpen(false);
  }, [pathname]);

  const isSolutionActive = ["/traditional", "/digital", "/airport"].includes(pathname);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0 48px",
        height: scrolled ? "60px" : "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "var(--bg-nav-scrolled)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
        boxSizing: "border-box",
      }}
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: "18px",
          color: "var(--text)",
          letterSpacing: "0.5px",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="5" fill="var(--text)" />
          <text x="14" y="20" textAnchor="middle" fill="var(--on-accent)" fontSize="13" fontWeight="900" fontFamily="Montserrat,sans-serif">
            A
          </text>
        </svg>
        ASHTON MEDIA
      </Link>

      {/* ── Desktop nav ── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "4px" }}
        className="hidden md:flex"
      >
        {/* Solutions dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setSolutionsOpen(true)}
          onMouseLeave={() => setSolutionsOpen(false)}
        >
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isSolutionActive ? "var(--text)" : "var(--white-tertiary)",
              fontSize: "13px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 0.2s",
              minHeight: "unset",
            }}
          >
            Solutions
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {solutionsOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "var(--bg-card-alt)",
                border: "1px solid var(--white-soft)",
                borderRadius: "10px",
                padding: "6px",
                minWidth: "210px",
                boxShadow: "0 24px 48px var(--black-shadow)",
              }}
            >
              {SOLUTIONS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  style={{
                    display: "block",
                    color: pathname === s.href ? "var(--text)" : "var(--white-tertiary)",
                    fontSize: "13px",
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                    padding: "10px 14px",
                    borderRadius: "7px",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--border)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = pathname === s.href ? "var(--text)" : "var(--white-tertiary)";
                  }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: pathname === link.href ? "var(--text)" : "var(--white-tertiary)",
              fontSize: "13px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              padding: "8px 14px",
              textDecoration: "none",
              transition: "color 0.2s",
              minHeight: "unset",
            }}
          >
            {link.label}
          </Link>
        ))}

        <Link
          href="/contact"
          style={{
            background: "var(--text)",
            color: "var(--on-accent)",
            fontSize: "13px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            padding: "10px 22px",
            borderRadius: "7px",
            marginLeft: "12px",
            textDecoration: "none",
            transition: "opacity 0.2s",
            minHeight: "unset",
            display: "inline-flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Advertise Now
        </Link>
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        className="flex md:hidden"
        onClick={() => setMenuOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: "8px", minHeight: "unset" }}
        aria-label="Toggle menu"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          {menuOpen ? (
            <path d="M17 5L5 17M5 5l12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            background: "var(--bg-raised)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            zIndex: 999,
          }}
        >
          {[
            { label: "Home", href: "/" },
            { label: "Traditional OOH", href: "/traditional" },
            { label: "Digital OOH", href: "/digital" },
            { label: "Airport Advertising", href: "/airport" },
            { label: "Gallery", href: "/gallery" },
            { label: "Case Studies", href: "/case-studies" },
            { label: "Blog", href: "/blog" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                color: pathname === href ? "var(--text)" : "var(--white-secondary)",
                fontSize: "15px",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                padding: "13px 0",
                textDecoration: "none",
                borderBottom: "1px solid var(--white-faintest)",
                display: "block",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            style={{
              background: "var(--text)",
              color: "var(--on-accent)",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              padding: "14px",
              borderRadius: "8px",
              marginTop: "16px",
              textAlign: "center",
              textDecoration: "none",
              display: "block",
            }}
          >
            Advertise Now
          </Link>
        </div>
      )}
    </nav>
  );
}
