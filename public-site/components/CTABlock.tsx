import Link from "next/link";
import { DEFAULT_WHATSAPP_TEXT, PHONE_DISPLAY, PHONE_HREF, whatsappHref } from "@/lib/contact";
import SectionHeading from "./SectionHeading";

interface Props {
  heading?: string;
  /** Second line of the heading, set in the light weight. */
  accent?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  /** Message prefilled in WhatsApp when the visitor taps through. */
  whatsappText?: string;
}

const BUTTON_CLASSES =
  "inline-flex items-center justify-center rounded-md text-sm py-3.75 px-6 sm:px-8 lg:px-9 no-underline transition-colors duration-350 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function CTABlock({
  heading = "Tell us where you",
  accent = "want to be seen.",
  body = "A real person replies with sites, photographs and a quote — usually within a few hours on business days.",
  primaryLabel = "Plan a campaign",
  primaryHref = "/plan-a-campaign",
  whatsappText = DEFAULT_WHATSAPP_TEXT,
}: Props) {
  return (
    <section className="bg-canvas border-t border-t-white/6 py-20 sm:py-24 lg:py-30 px-(--gutter) md:px-6 lg:px-8 text-center text-white">
      <div className="max-w-220 mx-auto">
        <SectionHeading lead={heading} accent={accent} className="text-[28px] sm:text-[40px] lg:text-[52px] tracking-[-1.5px] leading-[1.08] mb-5" />
        <p className="text-[15px] sm:text-base text-white/45 leading-[1.7] mb-9 max-w-115 mx-auto">{body}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={primaryHref} className={`${BUTTON_CLASSES} bg-accent text-canvas font-bold hover:bg-accent/85`}>
            {primaryLabel}
          </Link>
          <a href={whatsappHref(whatsappText)} target="_blank" rel="noopener noreferrer" className={`${BUTTON_CLASSES} border border-white/20 text-white/75 font-semibold hover:border-white/45 hover:text-white`}>
            WhatsApp us
          </a>
        </div>
        <p className="text-[13px] text-white/35 mt-6">
          Or call{" "}
          <a href={PHONE_HREF} className="text-white/65 no-underline hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    </section>
  );
}
