import type { SiteImage } from "./site-content";

export interface CaseStudyMetric {
  value: string;
  label: string;
}

/** One published case study from the API, validated. */
export interface CaseStudy {
  id: number;
  brand: string;
  /** Badge text, e.g. "Digital OOH". "" when the API sent none. */
  formatLabel: string;
  headline: string;
  description: string;
  image: SiteImage;
  /** 0 to 3, in the order editors set. */
  metrics: CaseStudyMetric[];
}

export interface CaseStudiesResult {
  /** "fallback" only when the API could not be read. An empty list from the API is still "api". */
  source: "api" | "fallback";
  items: CaseStudy[];
}
