import type { SVGProps } from "react";

/**
 * The site's icon set: line icons drawn on a 24-unit grid with a 1.5 stroke
 * and round caps and joins. Each takes its colour from the text around it and
 * is 1em square unless a className says otherwise.
 *
 * Icons are decorative: they are hidden from screen readers, and the text
 * beside one carries the meaning. An icon that stands alone needs a label on
 * its parent.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** A map pin: a place, a location. */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21.25s-6.75-5.7-6.75-11a6.75 6.75 0 0 1 13.5 0c0 5.3-6.75 11-6.75 11z" />
      <circle cx="12" cy="10.25" r="2.5" />
    </Icon>
  );
}

/** A light bulb: lighting, illumination. */
export function BulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9.25 17.25v-1.1a3.5 3.5 0 0 0-1.3-2.6 6.25 6.25 0 1 1 8.1 0 3.5 3.5 0 0 0-1.3 2.6v1.1z" />
      <path d="M9.75 20.75h4.5" />
    </Icon>
  );
}

/** A set square: size, dimensions, format. */
export function SetSquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.75 20.25V4.5l15.75 15.75z" />
      <path d="M7.5 16.5v-3.75l3.75 3.75z" />
    </Icon>
  );
}

/** A bar chart: counts, measured data. */
export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 20.25h17" />
      <path d="M5.75 20.25v-7.5h3v7.5" />
      <path d="M10.5 20.25V4.5h3v15.75" />
      <path d="M15.25 20.25V9.75h3v10.5" />
    </Icon>
  );
}
