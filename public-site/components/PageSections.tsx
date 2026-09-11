interface PageHeroProps {
  title: string;
  sub: string;
  tag: string;
}

export function PageHero({ title, sub, tag }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-canvas border-b border-b-white/7 pt-25 sm:pt-30 md:pt-35 lg:pt-40 px-2.5 sm:px-4 md:px-6 lg:px-8 pb-10 sm:pb-14 md:pb-16 lg:pb-18">
      <div className="max-w-300 mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-7 h-px bg-white/40" />
          <span className="text-[11px] font-semibold tracking-[3px] text-white/40 uppercase">
            {tag}
          </span>
        </div>
        <h1 className="font-black text-[40px] sm:text-[56px] lg:text-[76px] mb-5 tracking-[-2px] leading-none text-white">
          {title}
        </h1>
        <p className="text-[17px] text-white/45 max-w-135 leading-[1.75] font-normal">
          {sub}
        </p>
      </div>
    </section>
  );
}

export function CTABar() {
  return (
    <div className="bg-card rounded-[10px] py-10 px-12 border border-white/8 flex items-center justify-between gap-10 flex-wrap">
      <div>
        <h3 className="font-extrabold text-[22px] mb-1.5 tracking-[-0.5px]">
          Ready to launch your campaign?
        </h3>
        <p className="text-sm text-white/40">
          Our team will build the perfect package for your brand and budget.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <a
          href="tel:+255758880088"
          className="text-sm font-semibold text-white/60 no-underline py-3 px-6 border border-white/15 rounded-md"
        >
          +255 758 88 00 88
        </a>
      </div>
    </div>
  );
}
