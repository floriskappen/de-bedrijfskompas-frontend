import { describe, expect, it } from "vitest";
import type { Company } from "./types";
import {
  DEFAULT_AXIS_MINIMUMS,
  filterCompanies,
  getCompanyDomainGroups,
  getCompositeScore,
  getDomainGroupCounts,
  getHistogramBuckets,
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

  it("axis minimum keeps unknowns at zero", () => {
    const company = makeCompany();

    expect(matchesAxisMinimum(company, "power", 0)).toBe(true);
  });

  it("axis minimum excludes unknowns above zero", () => {
    const company = makeCompany();

    expect(matchesAxisMinimum(company, "power", 5)).toBe(false);
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

  it("histogram includes unknown bucket", () => {
    const buckets = getHistogramBuckets([makeCompany()], "power");

    expect(buckets[0]).toMatchObject({ id: "unknown", count: 1 });
  });

  it("histogram buckets aggregate by tens", () => {
    const companies = [
      makeCompany({ company_id: "a", scores: { ...makeCompany().scores, ecology: { score: 55, evidence: "partial" } } }),
      makeCompany({ company_id: "b", scores: { ...makeCompany().scores, ecology: { score: 62, evidence: "partial" } } }),
      makeCompany({ company_id: "c", scores: { ...makeCompany().scores, ecology: { score: 75, evidence: "partial" } } }),
    ];
    const buckets = getHistogramBuckets(companies, "ecology");

    expect(buckets.find((bucket) => bucket.id === "50")?.count).toBe(1);
    expect(buckets.find((bucket) => bucket.id === "60")?.count).toBe(1);
    expect(buckets.find((bucket) => bucket.id === "70")?.count).toBe(1);
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
    };

    expect(filterCompanies(companies, filters).map((company) => company.company_id)).toEqual(["a", "b"]);
    expect(getDomainGroupCounts(companies, filters)["software-it"]).toBe(1);
    expect(getDomainGroupCounts(companies, filters)["science-research"]).toBe(1);
  });
});
