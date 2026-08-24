import { SiteType, FORMAT_CONFIG } from "@/lib/data";

interface Props {
  type: SiteType;
  small?: boolean;
}

// Server Component — zero JS, renders to pure HTML span.
export default function FormatBadge({ type, small = false }: Props) {
  const c = FORMAT_CONFIG[type] ?? FORMAT_CONFIG.traditional;
  return (
    <span
      style={{
        fontSize: small ? "10px" : "11px",
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: c.color,
        background: c.bg,
        padding: small ? "3px 8px" : "4px 10px",
        borderRadius: "4px",
        fontFamily: "'Montserrat',sans-serif",
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {c.label}
    </span>
  );
}
