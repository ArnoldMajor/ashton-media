// Do not add alcohol, gambling/betting or tobacco brands. Only show brands that are clients and have agreed to be shown.

/**
 * How a brand is drawn in the home page banner (components/home/BrandMarquee.tsx):
 * - "white": the logo is already white or near-white, so it goes straight on the dark page.
 * - "tile":  a coloured or dark logo, shown as it is on a white rounded tile.
 * - "text":  no logo file yet, so the name is set in type.
 */
export type BrandTreatment = "white" | "tile" | "text";

interface BrandBase {
  name: string;
  /**
   * Pixel size of the logo file. For a "text" entry, the size of the name set
   * in the banner's type (Montserrat ExtraBold) at 14px, as measured in Chrome.
   * The banner works out every rendered width, its repeat count and its speed
   * from these two numbers, so keep them true to the file.
   */
  width: number;
  height: number;
}

export type Brand = BrandBase &
  (
    | { /** Path under public/, e.g. "/images/brands/vodacom.svg". */ file: string; treatment: "white" | "tile" }
    | { file: null; treatment: "text" }
  );

// Every entry is "text" until its logo is supplied. To add one, put the file in
// public/images/brands/ and set `file`, its pixel `width` and `height`, and the
// treatment.
export const BRANDS: Brand[] = [
  { name: "Vodacom", file: null, width: 71, height: 14, treatment: "text" },
  { name: "Airtel", file: null, width: 42, height: 14, treatment: "text" },
  { name: "CRDB Bank", file: null, width: 86, height: 14, treatment: "text" },
  { name: "Azam", file: null, width: 43, height: 14, treatment: "text" },
  { name: "NMB Bank", file: null, width: 79, height: 14, treatment: "text" },
  { name: "Coca-Cola", file: null, width: 75, height: 14, treatment: "text" },
];
