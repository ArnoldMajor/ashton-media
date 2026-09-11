import { SiteType } from "@/lib/data";

interface Props {
  type: SiteType;
  small?: boolean;
}

const VARIANT_CLASSES: Record<SiteType, string> = {
  digital: "text-lime bg-lime/10 border-lime/25",
  traditional: "text-white/85 bg-white/7 border-white/15",
  airport: "text-white/55 bg-white/5 border-white/10",
};

const LABELS: Record<SiteType, string> = {
  digital: "Digital",
  traditional: "Traditional",
  airport: "Airport",
};

export default function FormatBadge({ type, small = false }: Props) {
  const variant = VARIANT_CLASSES[type] ?? VARIANT_CLASSES.traditional;
  const label = LABELS[type] ?? LABELS.traditional;

  return (
    <span
      className={`font-bold uppercase tracking-[1.5px] rounded whitespace-nowrap shrink-0 border ${
        small ? "text-[10px] py-[3px] px-2" : "text-[11px] py-1 px-2.5"
      } ${variant}`}
    >
      {label}
    </span>
  );
}
