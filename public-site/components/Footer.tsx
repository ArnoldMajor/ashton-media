import Link from "next/link";
import Image from "next/image";
import AshtonWhiteLogo from "@/public/ashton-logo-white.svg";

const SOLUTIONS = [
  { label: "Traditional OOH", href: "/traditional" },
  { label: "Digital OOH", href: "/digital" },
  { label: "Airport Advertising", href: "/airport" },
];

const COMPANY = [
  { label: "Gallery", href: "/gallery" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-footer border-t border-t-white/7 pt-18 pb-10">
      <div className="max-w-300 mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-10 mb-14">
          <div>
            <div className="mb-4">
              <Image src={AshtonWhiteLogo} width={140} alt="Ashton Media Logo" />
            </div>
            <p className="text-[13px] text-white/35 leading-[1.7] max-w-50">
              Tanzania's #1 out-of-home advertising network since 2005.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-white/25 uppercase mb-4">
              Solutions
            </div>
            {SOLUTIONS.map((l) => (
              <Link key={l.href} href={l.href} className="block text-[13px] text-white/45 no-underline mb-2.5 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-white/25 uppercase mb-4">
              Company
            </div>
            {COMPANY.map((l) => (
              <Link key={l.href} href={l.href} className="block text-[13px] text-white/45 no-underline mb-2.5">
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-white/25 uppercase mb-4">
              Get in Touch
            </div>
            <a href="tel:+255758880088" className="block text-[13px] text-white/45 no-underline mb-2.5">
              +255 758 88 00 88
            </a>
            <a href="mailto:info@ashtonmedia.net" className="block text-[13px] text-white/45 no-underline mb-2.5">
              info@ashtonmedia.net
            </a>
            <p className="text-[13px] text-white/35 leading-[1.6] mt-2">
              Dar es Salaam<br />Tanzania
            </p>
          </div>
        </div>

        <div className="border-t border-t-white/6 pt-6 flex justify-between items-center flex-wrap gap-3">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Ashton Media Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service"].map((t) => (
              <span key={t} className="text-xs text-white/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
