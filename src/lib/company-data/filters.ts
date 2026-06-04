import type { AxisId, Company, DomainGroupId } from "./types";
import { AXIS_IDS, DOMAIN_GROUP_IDS } from "./types";
import { getDomainGroupsForCapabilityTags } from "./isco";

export type AxisMinimums = Record<AxisId, number>;

export interface CompanyFilters {
  axisMinimums: AxisMinimums;
  selectedDomains: DomainGroupId[];
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
  selectedDomains: [],
};

export function getCompanyDomainGroups(company: Pick<Company, "capability_tags">): DomainGroupId[] {
  const tags = Array.isArray(company.capability_tags) ? company.capability_tags : [];
  return getDomainGroupsForCapabilityTags(tags);
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

export function matchesSelectedDomains(
  company: Pick<Company, "capability_tags">,
  selectedDomains: DomainGroupId[]
): boolean {
  const domains = new Set(getCompanyDomainGroups(company));
  return selectedDomains.every((domain) => domains.has(domain));
}

export function matchesCompanyFilters(company: Company, filters: CompanyFilters): boolean {
  const matchesAxes = AXIS_IDS.every((axis) =>
    matchesAxisMinimum(company, axis, filters.axisMinimums[axis] ?? 0)
  );

  return matchesAxes && matchesSelectedDomains(company, filters.selectedDomains);
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

export function getCompaniesForDomainFacet(
  companies: Company[],
  filters: CompanyFilters,
  domain: DomainGroupId
): Company[] {
  return filterCompanies(companies, {
    ...filters,
    selectedDomains: filters.selectedDomains.filter((selectedDomain) => selectedDomain !== domain),
  });
}

export function getDomainGroupCounts(companies: Company[], filters: CompanyFilters): Record<DomainGroupId, number> {
  return DOMAIN_GROUP_IDS.reduce(
    (counts, domain) => {
      counts[domain] = getCompaniesForDomainFacet(companies, filters, domain).filter((company) =>
        getCompanyDomainGroups(company).includes(domain)
      ).length;
      return counts;
    },
    {} as Record<DomainGroupId, number>
  );
}

export function hasActiveFilters(filters: CompanyFilters): boolean {
  return (
    filters.selectedDomains.length > 0 ||
    AXIS_IDS.some((axis) => (filters.axisMinimums[axis] ?? 0) > 0)
  );
}
