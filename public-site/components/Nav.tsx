"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import AshtonWhiteLogo from "@/public/ashton-logo-white.svg";

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

const MOBILE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Traditional OOH", href: "/traditional" },
  { label: "Digital OOH", href: "/digital" },
  { label: "Airport Advertising", href: "/airport" },
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSolutionsOpen(false);
  }, [pathname]);

  const isSolutionActive = ["/traditional", "/digital", "/airport"].includes(pathname);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-1000 flex items-center transition-all duration-300 ${scrolled ? "h-15 bg-nav-scrolled backdrop-blur-[20px] border-b-white/7" : "h-18 bg-transparent"
        }`}
    >
      <div className="w-full max-w-300 mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-lg text-white tracking-[0.5px] no-underline flex items-center gap-2.5">
          <Image src={AshtonWhiteLogo} width={150} alt="Ashton Media Logo" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              className={`bg-transparent border-none cursor-pointer text-[13px] font-medium py-2 px-3.5 flex items-center gap-1.25 transition-colors min-h-0 ${isSolutionActive ? "text-white" : "text-white/65"
                }`}
            >
              Solutions
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {solutionsOpen && (
              <div className="absolute top-full left-0 bg-card-alt border border-white/10 rounded-[10px] p-1.5 min-w-52.5 shadow-[0_24px_48px_rgba(0,0,0,0.8)]">
                {SOLUTIONS.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={`block text-[13px] font-medium py-2.5 px-3.5 rounded-[7px] no-underline transition-all hover:bg-white/7 hover:text-white ${pathname === s.href ? "text-white" : "text-white/65"
                      }`}
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
              className={`text-[13px] font-medium py-2 px-3.5 no-underline transition-colors min-h-0 ${pathname === link.href ? "text-white" : "text-white/65"
                }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/contact"
            className="bg-white text-black text-[13px] font-bold py-2.5 px-5.5 rounded-[7px] ml-3 no-underline transition-opacity min-h-0 inline-flex items-center hover:opacity-85"
          >
            Advertise Now
          </Link>
        </div>

        <button
          className="flex md:hidden bg-transparent border-none cursor-pointer text-white p-2 min-h-0"
          onClick={() => setMenuOpen((o) => !o)}
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
      </div>

      {menuOpen && (
        <div className="fixed top-15 left-0 right-0 bg-raised border-b border-b-white/7 pt-4 px-8 pb-7 flex flex-col gap-0.5 z-999">
          {MOBILE_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-[15px] font-semibold py-3.25 no-underline border-b border-b-white/5 block ${pathname === href ? "text-white" : "text-white/60"
                }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="bg-white text-black text-sm font-bold py-3.5 rounded-lg mt-4 text-center no-underline block"
          >
            Advertise Now
          </Link>
        </div>
      )}
    </nav>
  );
}
