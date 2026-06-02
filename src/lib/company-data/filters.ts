import type { AxisId, Company, TagId } from "./types";
import { AXIS_IDS, TAG_IDS } from "./types";

export type AxisMinimums = Record<AxisId, number>;

export interface CompanyFilters {
  axisMinimums: AxisMinimums;
  selectedTags: TagId[];
}

export type HistogramBucketId = "unknown" | "0" | "10" | "20" | "30" | "40" | "50" | "60" | "70" | "80" | "90";

export interface HistogramBucket {
  id: HistogramBucketId;
  label: string;
  minimum: number | null;
  count: number;
}

export const DEFAULT_AXIS_MINIMUMS: AxisMinimums = {
  substance: 0,
  ecology: 0,
  power: 0,
  embeddedness: 0,
  posture: 0,
};

export const EMPTY_FILTERS: CompanyFilters = {
  axisMinimums: DEFAULT_AXIS_MINIMUMS,
  selectedTags: [],
};

export function getCompanyTags(company: Pick<Company, "capability_tags">): TagId[] {
  const tags = Array.isArray(company.capability_tags) ? company.capability_tags : [];
  return tags.map((tag) => tag.family);
}

export function getCompositeScore(company: Pick<Company, "scores">): number | null {
  const values = AXIS_IDS
    .map((axis) => company.scores[axis]?.score)
    .filter((score): score is number => typeof score === "number");

  if (values.length === 0) return null;

  const total = values.reduce((sum, score) => sum + score, 0);
  return Math.round(total / values.length);
}

export function matchesAxisMinimum(
  company: Pick<Company, "scores">,
  axis: AxisId,
  minimum: number
): boolean {
  if (minimum <= 0) return true;

  const score = company.scores[axis]?.score;
  return typeof score === "number" && score >= minimum;
}

export function matchesSelectedTags(
  company: Pick<Company, "capability_tags">,
  selectedTags: TagId[]
): boolean {
  const tags = new Set(getCompanyTags(company));
  return selectedTags.every((tag) => tags.has(tag));
}

export function matchesCompanyFilters(company: Company, filters: CompanyFilters): boolean {
  const matchesAxes = AXIS_IDS.every((axis) =>
    matchesAxisMinimum(company, axis, filters.axisMinimums[axis] ?? 0)
  );

  return matchesAxes && matchesSelectedTags(company, filters.selectedTags);
}

export function filterCompanies(companies: Company[], filters: CompanyFilters): Company[] {
  return companies.filter((company) => matchesCompanyFilters(company, filters));
}

export function getHistogramBuckets(companies: Company[], axis: AxisId): HistogramBucket[] {
  const buckets: HistogramBucket[] = [
    { id: "unknown", label: "?", minimum: null, count: 0 },
    ...Array.from({ length: 10 }, (_, index) => {
      const start = index * 10;
      const end = index === 9 ? 100 : start + 9;
      return { id: String(start) as HistogramBucketId, label: `${start}-${end}`, minimum: start, count: 0 };
    }),
  ];

  for (const company of companies) {
    const score = company.scores[axis]?.score;
    if (typeof score !== "number") {
      buckets[0].count += 1;
      continue;
    }

    const index = score >= 90 ? 10 : Math.floor(score / 10) + 1;
    buckets[index].count += 1;
  }

  return buckets;
}

export function getCompaniesForAxisFacet(
  companies: Company[],
  filters: CompanyFilters,
  axis: AxisId
): Company[] {
  return filterCompanies(companies, {
    ...filters,
    axisMinimums: {
      ...filters.axisMinimums,
      [axis]: 0,
    },
  });
}

export function getCompaniesForTagFacet(
  companies: Company[],
  filters: CompanyFilters,
  tag: TagId
): Company[] {
  return filterCompanies(companies, {
    ...filters,
    selectedTags: filters.selectedTags.filter((selectedTag) => selectedTag !== tag),
  });
}

export function getTagCounts(companies: Company[], filters: CompanyFilters): Record<TagId, number> {
  return TAG_IDS.reduce(
    (counts, tag) => {
      counts[tag] = getCompaniesForTagFacet(companies, filters, tag).filter((company) =>
        getCompanyTags(company).includes(tag)
      ).length;
      return counts;
    },
    {} as Record<TagId, number>
  );
}

export function hasActiveFilters(filters: CompanyFilters): boolean {
  return (
    filters.selectedTags.length > 0 ||
    AXIS_IDS.some((axis) => (filters.axisMinimums[axis] ?? 0) > 0)
  );
}
