import { SITES } from "@/lib/data";

export default function TanzaniaMap() {
  return (
    <svg
      viewBox="0 0 400 420"
      className="w-full h-full max-w-90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tanzania outline */}
      <path
        d="M120,30 L160,20 L210,25 L260,30 L310,50 L340,80 L350,120 L360,160 L355,200 L360,240 L350,280 L330,310 L300,340 L270,370 L240,390 L210,395 L180,385 L160,370 L140,350 L120,330 L100,310 L80,280 L70,250 L65,220 L70,190 L75,160 L80,130 L90,100 L100,70 Z"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />
      {/* Zanzibar */}
      <ellipse cx="340" cy="200" rx="20" ry="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Site dots */}
      {SITES.map((site) => {
        const col = site.type === "digital" ? "var(--color-lime)" : "rgba(255,255,255,0.7)";
        const r = site.type === "airport" ? 6 : site.type === "digital" ? 5 : 4;
        return (
          <g key={site.id}>
            {site.available && (
              <circle cx={site.coords.x} cy={site.coords.y} r={r + 5} fill={col} opacity="0.07" />
            )}
            <circle cx={site.coords.x} cy={site.coords.y} r={r} fill={col} opacity={site.available ? 0.9 : 0.3} />
          </g>
        );
      })}

      {/* City labels */}
      {[
        { x: 230, y: 205, label: "Dar es Salaam" },
        { x: 155, y: 128, label: "Arusha" },
        { x: 118, y: 198, label: "Mwanza" },
        { x: 200, y: 250, label: "Dodoma" },
      ].map((c) => (
        <text key={c.label} x={c.x + 9} y={c.y + 4} fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="Montserrat,sans-serif">
          {c.label}
        </text>
      ))}

      {/* Legend */}
      <g transform="translate(16,356)">
        <circle cx="5" cy="5" r="4" fill="var(--color-lime)" opacity="0.9" />
        <text x="13" y="9" fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="Montserrat,sans-serif">Digital</text>
        <circle cx="5" cy="21" r="4" fill="rgba(255,255,255,0.7)" opacity="0.8" />
        <text x="13" y="25" fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="Montserrat,sans-serif">Traditional / Airport</text>
      </g>
    </svg>
  );
}
