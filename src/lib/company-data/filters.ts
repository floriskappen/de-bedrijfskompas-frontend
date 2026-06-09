import type { AxisId, Company, DomainGroupId } from "./types";
import { AXIS_IDS, DOMAIN_GROUP_IDS } from "./types";
import { getDomainGroupsForCapabilityTags } from "./isco";
import { FOCUS_LEVEL_ORDER, focusLevelOrdinal, getFocusLevel, type FocusLevel } from "./focus-level";

// Per-axis filter minimum is a focus level; `none` means "no preference".
export type AxisMinimums = Record<AxisId, FocusLevel>;

export interface CompanyFilters {
  axisMinimums: AxisMinimums;
  selectedDomains: DomainGroupId[];
  favoritesOnly: boolean;
}

export interface HistogramBucket {
  id: FocusLevel;
  count: number;
}

export const DEFAULT_AXIS_MINIMUMS: AxisMinimums = {
  substance: "none",
  ecology: "none",
  power: "none",
  embeddedness: "none",
  posture: "none",
};

export const EMPTY_FILTERS: CompanyFilters = {
  axisMinimums: DEFAULT_AXIS_MINIMUMS,
  selectedDomains: [],
  favoritesOnly: false,
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
  minimum: FocusLevel
): boolean {
  if (minimum === "none") return true;

  const level = getFocusLevel(company.scores[axis]?.score);
  return focusLevelOrdinal(level) >= focusLevelOrdinal(minimum);
}

export function matchesSelectedDomains(
  company: Pick<Company, "capability_tags">,
  selectedDomains: DomainGroupId[]
): boolean {
  const domains = new Set(getCompanyDomainGroups(company));
  return selectedDomains.every((domain) => domains.has(domain));
}

function toFavoriteSet(favoriteIds: Iterable<string> = []): Set<string> {
  return favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds);
}

export function matchesCompanyFilters(
  company: Company,
  filters: CompanyFilters,
  favoriteIds: Iterable<string> = []
): boolean {
  const matchesAxes = AXIS_IDS.every((axis) =>
    matchesAxisMinimum(company, axis, filters.axisMinimums[axis] ?? "none")
  );
  const matchesFavorites = !filters.favoritesOnly || toFavoriteSet(favoriteIds).has(company.company_id);

  return matchesAxes && matchesSelectedDomains(company, filters.selectedDomains) && matchesFavorites;
}

export function filterCompanies(
  companies: Company[],
  filters: CompanyFilters,
  favoriteIds: Iterable<string> = []
): Company[] {
  const favoriteSet = toFavoriteSet(favoriteIds);
  return companies.filter((company) => matchesCompanyFilters(company, filters, favoriteSet));
}

export function getHistogramBuckets(companies: Company[], axis: AxisId): HistogramBucket[] {
  const counts: Record<FocusLevel, number> = { none: 0, low: 0, medium: 0, high: 0 };

  for (const company of companies) {
    counts[getFocusLevel(company.scores[axis]?.score)] += 1;
  }

  return FOCUS_LEVEL_ORDER.map((id) => ({ id, count: counts[id] }));
}

export function getCompaniesForAxisFacet(
  companies: Company[],
  filters: CompanyFilters,
  axis: AxisId,
  favoriteIds: Iterable<string> = []
): Company[] {
  return filterCompanies(companies, {
    ...filters,
    axisMinimums: {
      ...filters.axisMinimums,
      [axis]: "none",
    },
  }, favoriteIds);
}

export function getCompaniesForDomainFacet(
  companies: Company[],
  filters: CompanyFilters,
  domain: DomainGroupId,
  favoriteIds: Iterable<string> = []
): Company[] {
  return filterCompanies(companies, {
    ...filters,
    selectedDomains: filters.selectedDomains.filter((selectedDomain) => selectedDomain !== domain),
  }, favoriteIds);
}

export function getFavoriteCount(
  companies: Company[],
  filters: CompanyFilters,
  favoriteIds: Iterable<string> = []
): number {
  const favoriteSet = toFavoriteSet(favoriteIds);
  return filterCompanies(companies, { ...filters, favoritesOnly: false }, favoriteSet).filter((company) =>
    favoriteSet.has(company.company_id)
  ).length;
}

export function getDomainGroupCounts(
  companies: Company[],
  filters: CompanyFilters,
  favoriteIds: Iterable<string> = []
): Record<DomainGroupId, number> {
  return DOMAIN_GROUP_IDS.reduce(
    (counts, domain) => {
      counts[domain] = getCompaniesForDomainFacet(companies, filters, domain, favoriteIds).filter((company) =>
        getCompanyDomainGroups(company).includes(domain)
      ).length;
      return counts;
    },
    {} as Record<DomainGroupId, number>
  );
}

export function hasActiveFilters(filters: CompanyFilters): boolean {
  return (
    filters.favoritesOnly ||
    filters.selectedDomains.length > 0 ||
    AXIS_IDS.some((axis) => (filters.axisMinimums[axis] ?? "none") !== "none")
  );
}
