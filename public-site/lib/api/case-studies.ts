import { cache } from "react";
import type { CaseStudiesResult, CaseStudy, CaseStudyMetric } from "@/types/case-study";
import { apiFetch } from "./client";
import { parseApiImage } from "./images";

const CASE_STUDIES_PATH = "/api/case-studies/";

// Same reasoning as site-content: the page has hardcoded case studies to fall
// back on, so it should not sit through a backend cold start.
export const CASE_STUDIES_TIMEOUT_MS = 8_000;

export const CASE_STUDIES_REVALIDATE_SECONDS = 60;

/** The backend allows three; anything beyond that is ignored rather than drawn. */
const MAX_METRICS = 3;

function text(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function adaptMetrics(raw: unknown): CaseStudyMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((metric): CaseStudyMetric | null => {
      if (typeof metric !== "object" || metric === null) return null;
      const value = text((metric as Record<string, unknown>).value);
      const label = text((metric as Record<string, unknown>).label);
      return value && label ? { value, label } : null;
    })
    .filter((metric): metric is CaseStudyMetric => metric !== null)
    .slice(0, MAX_METRICS);
}

/**
 * Converts one raw API record into a CaseStudy. Returns null (and logs a
 * warning) for a record the page could not draw: no id, brand or headline, or
 * no usable photo.
 */
export function adaptCaseStudy(raw: unknown): CaseStudy | null {
  if (typeof raw !== "object" || raw === null) {
    console.warn("[case-studies] dropping a record that is not an object");
    return null;
  }
  const record = raw as Record<string, unknown>;

  const id = record.id;
  const brand = text(record.brand);
  const headline = text(record.headline);
  if (typeof id !== "number" || !brand || !headline) {
    console.warn(`[case-studies] dropping "${brand || id || "unnamed"}": missing id, brand or headline`);
    return null;
  }

  const image = parseApiImage(record.image, `case-studies "${brand}"`);
  if (!image) {
    console.warn(`[case-studies] dropping "${brand}": no usable image`);
    return null;
  }

  return {
    id,
    brand,
    formatLabel: text(record.format_label),
    headline,
    description: text(record.description),
    image,
    metrics: adaptMetrics(record.metrics),
  };
}

/**
 * Published case studies from the Django API, in the order editors set.
 * Intended to be called from a Server Component. Never throws.
 *
 * `source` tells the page which of three things happened: the API answered
 * with case studies, the API answered with none (editors have unpublished them
 * all, so the page says so), or the API could not be read ("fallback", and the
 * page shows its hardcoded ones).
 */
export const getCaseStudies = cache(async (): Promise<CaseStudiesResult> => {
  try {
    const json = await apiFetch<unknown>(CASE_STUDIES_PATH, {
      timeoutMs: CASE_STUDIES_TIMEOUT_MS,
      next: { revalidate: CASE_STUDIES_REVALIDATE_SECONDS },
    });

    // A bare array today; a DRF-paginated object is read too, as for billboards.
    const records: unknown = Array.isArray(json) ? json : (json as { results?: unknown } | null)?.results;

    // An answer that isn't a list at all is a broken response, not "no case studies".
    if (!Array.isArray(records)) {
      console.warn("[case-studies] response was not a list, using built-in case studies");
      return { source: "fallback", items: [] };
    }

    const items = records.map(adaptCaseStudy).filter((study): study is CaseStudy => study !== null);

    // Records came back but none could be drawn (say, R2 moved to a host that
    // isn't in lib/media-hosts.ts yet). That is a fault, not editors having
    // unpublished everything, so it must not reach the page as an empty list.
    if (records.length > 0 && items.length === 0) {
      console.warn("[case-studies] no usable records in the response, using built-in case studies");
      return { source: "fallback", items: [] };
    }
    return { source: "api", items };
  } catch (err) {
    console.warn("[case-studies] fetch failed, using built-in case studies:", err instanceof Error ? err.message : err);
    return { source: "fallback", items: [] };
  }
});
