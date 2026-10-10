import type { BillboardFormat } from "@/types/billboard";

interface Props {
  format: BillboardFormat;
  /** Display name from the API (`format_display`); falls back to a built-in label. */
  label?: string;
  small?: boolean;
}

const DEFAULT_VARIANT = "text-white/85 bg-white/7 border-white/15";

const VARIANT_CLASSES: Partial<Record<BillboardFormat, string>> = {
  digital: "text-white bg-white/12 border-white/45",
  airport: "text-white/55 bg-white/5 border-white/10",
  station: "text-white/55 bg-white/5 border-white/10",
};

const LABELS: Record<BillboardFormat, string> = {
  static: "Static",
  digital: "Digital",
  light_pole: "Light Pole",
  airport: "Airport",
  station: "Station",
  other: "Other",
};

export default function FormatBadge({ format, label, small = false }: Props) {
  const variant = VARIANT_CLASSES[format] ?? DEFAULT_VARIANT;

  return (
    <span
      className={`font-bold uppercase tracking-[1.5px] rounded whitespace-nowrap shrink-0 border ${
        small ? "text-[10px] py-[3px] px-2" : "text-[11px] py-1 px-2.5"
      } ${variant}`}
    >
      {/* Digital is marked by a dot, the same shape the map gives it — no hue involved. */}
      {format === "digital" && <span aria-hidden className="inline-block size-1.5 rounded-full bg-current align-middle mr-1.5 mb-px" />}
      {label || LABELS[format]}
    </span>
  );
}
