import Link from "next/link";

const PHONE_DISPLAY = "+255 758 880 088";
const PHONE_HREF = "tel:+255758880088";
const WHATSAPP_NUMBER = "255758880088";

interface Props {
  heading?: string;
  /** Second line of the heading, set in the italic accent face. */
  accent?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  /** Message prefilled in WhatsApp when the visitor taps through. */
  whatsappText?: string;
}

const BUTTON_CLASSES =
  "inline-flex items-center justify-center rounded-md text-sm py-3.75 px-6 sm:px-8 lg:px-9 no-underline transition-colors duration-350 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber";

export default function CTABlock({
  heading = "Tell us where you",
  accent = "want to be seen.",
  body = "A real person replies with sites, photographs and a quote — usually within a few hours on business days.",
  primaryLabel = "Plan a campaign",
  primaryHref = "/plan-a-campaign",
  whatsappText = "Hello Ashton Media, I'd like to plan a campaign.",
}: Props) {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <section className="bg-ground font-body border-t border-t-white/6 py-20 sm:py-24 lg:py-30 px-2.5 sm:px-4 md:px-6 lg:px-8 text-center text-white">
      <div className="max-w-220 mx-auto">
        <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] lg:text-[52px] tracking-[-1.5px] leading-[1.08] mb-5">
          {heading}
          <br />
          <span className="font-accent italic font-normal tracking-[-0.5px] text-amber">{accent}</span>
        </h2>
        <p className="text-[15px] sm:text-base text-white/45 leading-[1.7] mb-9 max-w-115 mx-auto">{body}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={primaryHref} className={`${BUTTON_CLASSES} bg-amber text-ground font-bold hover:bg-amber/85`}>
            {primaryLabel}
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${BUTTON_CLASSES} border border-white/20 text-white/75 font-semibold hover:border-white/45 hover:text-white`}>
            WhatsApp us
          </a>
        </div>
        <p className="text-[13px] text-white/35 mt-6">
          Or call{" "}
          <a href={PHONE_HREF} className="text-white/65 no-underline hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber">
            {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    </section>
  );
}
