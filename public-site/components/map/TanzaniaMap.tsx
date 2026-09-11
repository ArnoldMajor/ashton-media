"use client";

import "@d3-maps/react/style.css";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { geoMercator } from "d3-geo";
import type { Topology } from "topojson-specification";
import {
  MapBase,
  MapFeatures,
  MapZoom,
  useMapZoom,
  type MapZoomRef,
  type MapFeatureNormalized,
} from "@d3-maps/react";
import { Tanzania10m as tanzania } from "@d3-maps/atlas/countries/tanzania";
import type { Location } from "@/types/location";
import MapMarkers from "./MapMarkers";

const LAKE_NAMES = new Set([
  "Lake Victoria",
  "Lake Tanganyika",
  "Lake Malawi",
  "Lake Nyasa",
  "Lake Rukwa",
  "Lake Eyasi",
  "Lake Natron",
  "Lake Manyara",
]);

function filterTanzanianLakes(features: readonly MapFeatureNormalized[]) {
  return features.filter((f) => LAKE_NAMES.has(String(f.properties?.name)));
}

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false; // corrected on the client once matchMedia is available
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

interface TanzaniaMapProps {
  locations: Location[];
  interactive?: boolean;
  onSelect?: (location: Location) => void;
  className?: string;
  usingFallback?: boolean;
}

export default function TanzaniaMap({ locations, interactive = false, onSelect, className = "", usingFallback = false }: TanzaniaMapProps) {
  const [lakes, setLakes] = useState<Topology | null>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const zoomRef = useRef<MapZoomRef>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const zoom = useMapZoom(zoomRef);

  useEffect(() => {
    let cancelled = false;
    import("@d3-maps/atlas/world/lakes/lakes-10m").then((mod) => {
      if (!cancelled) {
        setLakes(mod.default as Topology);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lakesLayer = lakes && (
    <MapFeatures data={lakes} objectKey="features" transformer={filterTanzanianLakes} fill="var(--map-lake)" stroke="var(--map-lake-stroke)" strokeWidth={1} />
  );

  const mapContent = (
    <>
      {/* lakes-as-context: bottom layer, shows water even where it extends past the border */}
      {lakesLayer}
      {/* the country itself */}
      <MapFeatures data={tanzania as unknown as Topology} objectKey="TZA" fill="var(--map-land)" stroke="var(--map-land-stroke)" strokeWidth={1} />
      {/* lakes-as-holes: same shapes again, page-background fill "cuts" them out of the land */}
      {lakesLayer}
      {ready && (
        <MapMarkers
          locations={locations}
          zoomScale={zoomScale}
          interactive={interactive}
          reducedMotion={reducedMotion}
          zoom={interactive ? zoom : undefined}
          onSelect={onSelect}
        />
      )}
    </>
  );

  return (
    <div className={`relative w-full ${className}`}>
      <MapBase
        projection={geoMercator}
        fit={tanzania as unknown as Topology}
        fitObjectKey="TZA"
        padding={24}
        aspectRatio={1.05}
        className={!ready ? (reducedMotion ? "opacity-60" : "animate-pulse") : undefined}
      >
        {interactive ? (
          <MapZoom ref={zoomRef} minZoom={1} maxZoom={16} transition={{ duration: reducedMotion ? 0 : 500 }} onZoom={(e) => setZoomScale(e.transform.k)}>
            {mapContent}
          </MapZoom>
        ) : (
          mapContent
        )}
      </MapBase>

      {ready && locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-white/40 text-center px-4">No locations published yet</p>
        </div>
      )}

      {ready && usingFallback && (
        <p className="absolute bottom-2 right-2 text-[9px] tracking-[1px] uppercase text-white/30">Showing sample data</p>
      )}
    </div>
  );
}
