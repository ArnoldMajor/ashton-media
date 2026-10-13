"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PHONE_DISPLAY, PHONE_HREF, whatsappHref } from "@/lib/contact";
import { PhoneIcon, WhatsAppIcon } from "./icons";

const CTA = { label: "Advertise Now", href: "/contact" };

/** How far down the page the visitor scrolls before the dock appears. */
const REVEAL_AFTER_PX = 400;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

// Shown once the hero's own buttons have scrolled away, and put away again
// when the footer comes into view: the footer has the same contact details,
// and the dock would sit on top of its last lines.
function shouldShow() {
  const footer = document.querySelector("footer");
  const footerInView = footer !== null && footer.getBoundingClientRect().top < window.innerHeight;
  return window.scrollY > REVEAL_AFTER_PX && !footerInView;
}

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const TAB_CLASSES = `flex flex-col items-center justify-center gap-1 min-w-16 px-2 rounded-md text-[11px] font-semibold text-white/75 no-underline ${FOCUS_RING}`;

const FLOAT_CLASSES = `group relative flex items-center justify-center size-12 min-h-0 rounded-full bg-card-alt border border-white/15 text-white no-underline shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-colors duration-350 hover:border-white/45 ${FOCUS_RING}`;

// The label that slides out beside a round button on hover or keyboard focus.
const FLOAT_LABEL_CLASSES =
  "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-card-alt border border-white/10 py-1.5 px-3 text-xs font-semibold text-white/85 opacity-0 translate-x-1 transition-[opacity,translate] duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 motion-reduce:transition-none";

/**
 * The three ways to reach sales, kept in reach while the visitor reads: the
 * call to action, a phone call and a WhatsApp chat. Below md it is a bar along
 * the bottom of the screen; from md up, a stack of floating buttons in the
 * bottom right corner.
 */
export default function ContactDock() {
  const pathname = usePathname();
  const visible = useSyncExternalStore(subscribe, shouldShow, () => false);
  // On the contact page the call to action would link to the page it is on.
  const showCta = pathname !== CTA.href;
  const whatsapp = whatsappHref();

  // z-900 keeps both under the nav and its open menu (z-1000) and under the site modal.
  const reveal = `transition-[translate,opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${
    visible ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-full"
  }`;

  return (
    <div inert={!visible}>
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-900 flex items-stretch gap-2 bg-raised/95 backdrop-blur-[20px] border-t border-t-white/10 pt-2 px-(--gutter) pb-[calc(0.5rem+env(safe-area-inset-bottom))] ${reveal}`}
      >
        <a href={PHONE_HREF} className={`${TAB_CLASSES} ${showCta ? "" : "flex-1"}`}>
          <PhoneIcon className="text-[20px]" />
          Call
        </a>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${TAB_CLASSES} ${showCta ? "" : "flex-1"}`}>
          <WhatsAppIcon className="text-[20px]" />
          WhatsApp
        </a>
        {showCta && (
          <Link href={CTA.href} className={`flex-1 flex items-center justify-center ml-1 rounded-md bg-white text-black text-[13px] font-bold no-underline whitespace-nowrap ${FOCUS_RING}`}>
            {CTA.label}
          </Link>
        )}
      </div>

      <div className={`hidden md:flex fixed bottom-6 right-6 z-900 flex-col items-end gap-3 ${reveal}`}>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us" className={FLOAT_CLASSES}>
          <WhatsAppIcon className="text-[22px]" />
          <span aria-hidden className={FLOAT_LABEL_CLASSES}>WhatsApp us</span>
        </a>
        <a href={PHONE_HREF} aria-label={`Call ${PHONE_DISPLAY}`} className={FLOAT_CLASSES}>
          <PhoneIcon className="text-[20px]" />
          <span aria-hidden className={FLOAT_LABEL_CLASSES}>Call {PHONE_DISPLAY}</span>
        </a>
        {showCta && (
          <Link href={CTA.href} className={`flex items-center h-12 min-h-0 px-6 rounded-full bg-white text-black text-[13px] font-bold no-underline shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-opacity hover:opacity-85 ${FOCUS_RING}`}>
            {CTA.label}
          </Link>
        )}
      </div>
    </div>
  );
}
