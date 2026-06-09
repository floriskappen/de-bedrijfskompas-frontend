import { describe, expect, it } from "vitest";
import type { Company } from "./types";
import {
  DEFAULT_AXIS_MINIMUMS,
  filterCompanies,
  getCompanyDomainGroups,
  getCompositeScore,
  getDomainGroupCounts,
  getFavoriteCount,
  getHistogramBuckets,
  hasActiveFilters,
  matchesCompanyFilters,
  matchesAxisMinimum,
  matchesSelectedDomains,
} from "./filters";
import {
  getDomainGroupsForIscoCode,
  getIscoSubMajorCode,
  getUnmappedSubMajorCodes,
  ISCO_SUB_MAJOR_CODES,
  SUB_MAJOR_DOMAIN_GROUPS,
} from "./isco";

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  company_id: "company",
  name: "company",
  status: "ok",
  latlng: { lat: 52, lng: 5 },
  capability_tags: [],
  scores: {
    substance: { score: 50, evidence: "partial" },
    ecology: { score: 50, evidence: "partial" },
    power: { score: null, evidence: "no_signal" },
    embeddedness: { score: 50, evidence: "partial" },
    posture: { score: 50, evidence: "partial" },
  },
  nl: {
    tagline: "tagline",
    scores: {
      substance: { reason: "reden" },
      ecology: { reason: "reden" },
      power: { reason: "reden" },
      embeddedness: { reason: "reden" },
      posture: { reason: "reden" },
    },
  },
  en: {
    tagline: "tagline",
    scores: {
      substance: { reason: "reason" },
      ecology: { reason: "reason" },
      power: { reason: "reason" },
      embeddedness: { reason: "reason" },
      posture: { reason: "reason" },
    },
  },
  ...overrides,
});

describe("company filter helpers", () => {
  it("composite score ignores unknown axes", () => {
    const company = makeCompany({
      scores: {
        substance: { score: 70, evidence: "partial" },
        ecology: { score: 55, evidence: "partial" },
        power: { score: null, evidence: "no_signal" },
        embeddedness: { score: 40, evidence: "partial" },
        posture: { score: 50, evidence: "partial" },
      },
    });

    expect(getCompositeScore(company)).toBe(54);
  });

  it("all-null scores produce unknown score", () => {
    const company = makeCompany({
      scores: {
        substance: { score: null, evidence: "no_signal" },
        ecology: { score: null, evidence: "no_signal" },
        power: { score: null, evidence: "no_signal" },
        embeddedness: { score: null, evidence: "no_signal" },
        posture: { score: null, evidence: "no_signal" },
      },
    });

    expect(getCompositeScore(company)).toBeNull();
  });

  it("none keeps null scores", () => {
    const company = makeCompany();

    expect(matchesAxisMinimum(company, "power", "none")).toBe(true);
  });

  it("low excludes only nulls", () => {
    const company = makeCompany(); // power is null, others score 50 (medium)

    expect(matchesAxisMinimum(company, "power", "low")).toBe(false);
    expect(matchesAxisMinimum(company, "substance", "low")).toBe(true);
  });

  it("high excludes lower bands", () => {
    const company = makeCompany({
      scores: {
        substance: { score: 80, evidence: "partial" }, // high
        ecology: { score: 50, evidence: "partial" }, // medium
        power: { score: 20, evidence: "partial" }, // low
        embeddedness: { score: null, evidence: "no_signal" }, // none
        posture: { score: 66, evidence: "partial" }, // high (boundary)
      },
    });

    expect(matchesAxisMinimum(company, "substance", "high")).toBe(true);
    expect(matchesAxisMinimum(company, "posture", "high")).toBe(true);
    expect(matchesAxisMinimum(company, "ecology", "high")).toBe(false);
    expect(matchesAxisMinimum(company, "power", "high")).toBe(false);
    expect(matchesAxisMinimum(company, "embeddedness", "high")).toBe(false);
  });

  it("domain filters combine with AND semantics", () => {
    const company = makeCompany({
      capability_tags: [
        { isco_code: "251", prominence: "core" },
        { isco_code: "243", prominence: "supporting" },
      ],
    });

    expect(matchesSelectedDomains(company, ["software-it", "sales-commercial"])).toBe(true);
    expect(matchesSelectedDomains(company, ["software-it", "business-finance-admin"])).toBe(false);
  });

  it("projects minor ISCO codes through sub-major work fields", () => {
    const company = makeCompany({
      capability_tags: [
        { isco_code: "251", prominence: "core" },
        { isco_code: "216", prominence: "supporting" },
      ],
    });

    expect(getIscoSubMajorCode("251")).toBe("25");
    expect(getDomainGroupsForIscoCode("216")).toEqual(["engineering-technical", "creative-media-culture"]);
    expect(getCompanyDomainGroups(company)).toEqual([
      "software-it",
      "engineering-technical",
      "creative-media-culture",
    ]);
  });

  it("domain projection covers every ISCO sub-major group", () => {
    expect(getUnmappedSubMajorCodes()).toEqual([]);
    expect(Object.keys(SUB_MAJOR_DOMAIN_GROUPS).sort()).toEqual([...ISCO_SUB_MAJOR_CODES].sort());
  });

  it("distribution keeps a no-signal bucket", () => {
    const buckets = getHistogramBuckets([makeCompany()], "power");

    expect(buckets[0]).toMatchObject({ id: "none", count: 1 });
  });

  it("buckets aggregate by focus level", () => {
    const companies = [
      makeCompany({ company_id: "a", scores: { ...makeCompany().scores, ecology: { score: 20, evidence: "partial" } } }),
      makeCompany({ company_id: "b", scores: { ...makeCompany().scores, ecology: { score: 50, evidence: "partial" } } }),
      makeCompany({ company_id: "c", scores: { ...makeCompany().scores, ecology: { score: 75, evidence: "partial" } } }),
    ];
    const buckets = getHistogramBuckets(companies, "ecology");

    expect(buckets.find((bucket) => bucket.id === "low")?.count).toBe(1);
    expect(buckets.find((bucket) => bucket.id === "medium")?.count).toBe(1);
    expect(buckets.find((bucket) => bucket.id === "high")?.count).toBe(1);
  });

  it("counts update with other active filters", () => {
    const companies = [
      makeCompany({
        company_id: "a",
        capability_tags: [
          { isco_code: "243", prominence: "core" },
          { isco_code: "251", prominence: "supporting" },
        ],
      }),
      makeCompany({
        company_id: "b",
        capability_tags: [
          { isco_code: "243", prominence: "core" },
          { isco_code: "213", prominence: "supporting" },
        ],
      }),
      makeCompany({
        company_id: "c",
        capability_tags: [{ isco_code: "251", prominence: "core" }],
      }),
    ];
    const filters = {
      axisMinimums: DEFAULT_AXIS_MINIMUMS,
      selectedDomains: ["sales-commercial" as const],
      favoritesOnly: false,
    };

    expect(filterCompanies(companies, filters).map((company) => company.company_id)).toEqual(["a", "b"]);
    expect(getDomainGroupCounts(companies, filters)["software-it"]).toBe(1);
    expect(getDomainGroupCounts(companies, filters)["science-research"]).toBe(1);
  });

  it("favorites-only matches saved companies", () => {
    const favorite = makeCompany({ company_id: "favorite" });
    const other = makeCompany({ company_id: "other" });
    const filters = {
      axisMinimums: DEFAULT_AXIS_MINIMUMS,
      selectedDomains: [],
      favoritesOnly: true,
    };

    expect(matchesCompanyFilters(favorite, filters, ["favorite"])).toBe(true);
    expect(matchesCompanyFilters(other, filters, ["favorite"])).toBe(false);
    expect(filterCompanies([favorite, other], filters, ["favorite"]).map((company) => company.company_id)).toEqual([
      "favorite",
    ]);
  });

  it("favorites-only can produce empty results", () => {
    const filters = {
      axisMinimums: DEFAULT_AXIS_MINIMUMS,
      selectedDomains: [],
      favoritesOnly: true,
    };

    expect(filterCompanies([makeCompany({ company_id: "a" })], filters, [])).toEqual([]);
  });

  it("favorites-only counts as an active filter", () => {
    expect(
      hasActiveFilters({
        axisMinimums: DEFAULT_AXIS_MINIMUMS,
        selectedDomains: [],
        favoritesOnly: true,
      })
    ).toBe(true);
  });

  it("favorite count respects other active filters", () => {
    const companies = [
      makeCompany({
        company_id: "a",
        capability_tags: [{ isco_code: "243", prominence: "core" }],
      }),
      makeCompany({
        company_id: "b",
        capability_tags: [{ isco_code: "251", prominence: "core" }],
      }),
      makeCompany({
        company_id: "c",
        capability_tags: [{ isco_code: "243", prominence: "core" }],
      }),
    ];
    const filters = {
      axisMinimums: DEFAULT_AXIS_MINIMUMS,
      selectedDomains: ["sales-commercial" as const],
      favoritesOnly: false,
    };

    expect(getFavoriteCount(companies, filters, ["a", "b"])).toBe(1);
  });

  it("facet counts respect favorites-only", () => {
    const companies = [
      makeCompany({
        company_id: "a",
        capability_tags: [{ isco_code: "243", prominence: "core" }],
      }),
      makeCompany({
        company_id: "b",
        capability_tags: [{ isco_code: "251", prominence: "core" }],
      }),
    ];
    const filters = {
      axisMinimums: DEFAULT_AXIS_MINIMUMS,
      selectedDomains: [],
      favoritesOnly: true,
    };

    expect(getDomainGroupCounts(companies, filters, ["a"])["sales-commercial"]).toBe(1);
    expect(getDomainGroupCounts(companies, filters, ["a"])["software-it"]).toBe(0);
  });
});
