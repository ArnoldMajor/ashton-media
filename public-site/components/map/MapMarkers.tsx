"use client";

import { useMemo } from "react";
import { MapMarker, useMapContext, zoomIdentity, getInverseZoomScale, type ZoomCommands } from "@d3-maps/react";
import type { Location, LocationCluster } from "@/types/location";
import { clusterByCity } from "@/lib/locations";

type FormatShape = "circle" | "square" | "diamond";

/**
 * One place to change when format gets colour later: swap `fill` per format
 * here (or read a per-format CSS var) instead of touching the shapes below.
 */
export const FORMAT_STYLE: Record<Location["format"], { shape: FormatShape; size: number }> = {
  digital: { shape: "circle", size: 7 },
  traditional: { shape: "square", size: 7 },
  airport: { shape: "diamond", size: 8 },
};

const ZOOM_CLUSTER_THRESHOLD = 2.5;
const CLUSTER_ZOOM_LEVEL = 5;
const CLUSTER_MIN_RADIUS = 10;
const CLUSTER_MAX_RADIUS = 22;

// Manual nudges for labels that would otherwise collide with the geometry.
// textAnchor "start" (rather than the default "middle") keeps the whole
// label to the right of its anchor point — safer for markers sitting near
// the western edge of the map, where a centered label could clip off-canvas.
const LABEL_NUDGE: Record<string, { dx: number; dy: number; anchor?: "start" | "middle" }> = {
  Mwanza: { dx: 12, dy: 3, anchor: "start" }, // sits right on the Lake Victoria shoreline — push east
};

function clusterRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return CLUSTER_MIN_RADIUS;
  const t = Math.sqrt(count / maxCount); // sqrt scale: AREA encodes count, not radius
  return CLUSTER_MIN_RADIUS + t * (CLUSTER_MAX_RADIUS - CLUSTER_MIN_RADIUS);
}

function FormatGlyph({ format, opacity }: { format: Location["format"]; opacity: number }) {
  const { shape, size } = FORMAT_STYLE[format];
  if (shape === "circle") return <circle r={size / 2} fill="var(--map-marker)" opacity={opacity} />;
  if (shape === "square") return <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="var(--map-marker)" opacity={opacity} />;
  return <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="var(--map-marker)" opacity={opacity} transform="rotate(45)" />;
}

function handleActivateKey(e: React.KeyboardEvent, run: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    run();
  }
}

interface MapMarkersProps {
  locations: Location[];
  zoomScale: number;
  interactive: boolean;
  reducedMotion: boolean;
  zoom?: ZoomCommands;
  onSelect?: (location: Location) => void;
}

export default function MapMarkers({ locations, zoomScale, interactive, reducedMotion, zoom, onSelect }: MapMarkersProps) {
  const { width, height, projection } = useMapContext();
  const clusters = useMemo(() => clusterByCity(locations), [locations]);
  const maxCount = useMemo(() => clusters.reduce((m, c) => Math.max(m, c.count), 1), [clusters]);
  const inverseScale = getInverseZoomScale(zoomScale);
  const showClusters = zoomScale < ZOOM_CLUSTER_THRESHOLD;

  const zoomToCluster = (cluster: LocationCluster) => {
    if (!zoom) return;
    const projected = projection(cluster.coordinates);
    if (!projected) return;
    const [x, y] = projected;
    const target = zoomIdentity
      .translate(width / 2, height / 2)
      .scale(CLUSTER_ZOOM_LEVEL)
      .translate(-x, -y);
    zoom.transform(target, reducedMotion ? false : { duration: 500 });
  };

  if (showClusters) {
    return (
      <>
        {clusters.map((cluster) => {
          const r = clusterRadius(cluster.count, maxCount);
          const clickable = interactive && cluster.count > 1 && !!zoom;
          const nudge = LABEL_NUDGE[cluster.city] ?? { dx: 0, dy: r + 11, anchor: "middle" as const };
          return (
            <MapMarker key={cluster.city} coordinates={cluster.coordinates}>
              <g transform={`scale(${inverseScale})`}>
                <g
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `${cluster.count} sites in ${cluster.city} — activate to zoom in` : `${cluster.city}, ${cluster.count} site${cluster.count === 1 ? "" : "s"}`}
                  onClick={clickable ? () => zoomToCluster(cluster) : undefined}
                  onKeyDown={clickable ? (e) => handleActivateKey(e, () => zoomToCluster(cluster)) : undefined}
                  style={clickable ? { cursor: "pointer" } : undefined}
                >
                  <circle r={r} fill="var(--map-marker)" />
                  <text textAnchor="middle" dominantBaseline="central" fill="var(--map-marker-label)" fontSize={11} fontWeight={700}>
                    {cluster.count}
                  </text>
                </g>
                <text x={nudge.dx} y={nudge.dy} textAnchor={nudge.anchor ?? "middle"} fill="var(--map-label)" fontSize={9}>
                  {cluster.city}
                </text>
              </g>
            </MapMarker>
          );
        })}
      </>
    );
  }

  return (
    <>
      {locations.map((loc) => (
        <MapMarker key={loc.id} coordinates={loc.coordinates}>
          <g transform={`scale(${inverseScale})`}>
            <g
              role="button"
              tabIndex={0}
              aria-label={`${loc.name}, ${loc.city}${loc.available ? "" : " — booked"}`}
              onClick={() => onSelect?.(loc)}
              onKeyDown={(e) => handleActivateKey(e, () => onSelect?.(loc))}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <FormatGlyph format={loc.format} opacity={loc.available ? 1 : 0.4} />
            </g>
          </g>
        </MapMarker>
      ))}
    </>
  );
}
