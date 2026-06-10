import { afterEach, describe, expect, it, vi } from "vitest";
import type { Company } from "../company-data/types";
import { DEFAULT_AXIS_MINIMUMS } from "../company-data/filters";
import {
  applyIkigaiAxisMinimums,
  buildIkigaiCompactCompanyProfile,
  buildIkigaiFullCompanyProfile,
  buildIscoDerivationPrompt,
  collectAllowedIkigaiIscoCodes,
  filterAllowedIkigaiIscoCandidates,
  getIkigaiAxisFilteredCount,
  preserveIkigaiIscoCandidatesOnAxisChange,
  parseIkigaiIscoCandidates,
  parsePass1CandidateIds,
  parsePass2SelectedMatches,
  rankIkigaiCompanyCandidates,
  runIkigaiMatching,
  saveIkigaiRun,
  shouldTightenIkigaiAxisFilters,
  toIkigaiAnswers,
  validateIkigaiAnswers,
  readIkigaiHistory,
  resetIkigaiHistoryForTests,
  resolveIkigaiRunCompanies,
  type IkigaiCompanyCandidate,
  type IkigaiIscoCandidate,
  type IkigaiRunRecord,
} from ".";
import type { ByokResult } from "../byok";

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

const completeAnswers = {
  currentWork: "i build software tools",
  strengths: "systems thinking and product engineering",
  caresAbout: "care, ecology, and practical public value",
  workContext: "small autonomous teams",
};

function stubLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

function makeRun(overrides: Partial<IkigaiRunRecord> = {}): IkigaiRunRecord {
  return {
    id: "run-1",
    schemaVersion: 1,
    createdAt: "2026-06-09T12:00:00.000Z",
    parentRunId: null,
    locale: "en",
    answers: completeAnswers,
    iscoCandidates: [{ iscoCode: "251", strength: "strong", reason: "software" }],
    axisMinimums: DEFAULT_AXIS_MINIMUMS,
    deterministicCandidateIds: ["a", "missing"],
    pass1CandidateIds: ["a", "missing"],
    selectedMatches: [{ companyId: "a", reason: "grounded fit" }, { companyId: "missing", reason: "gone" }],
    refinements: [],
    ...overrides,
  };
}

describe("ikigai core", () => {
  afterEach(() => {
    resetIkigaiHistoryForTests();
    vi.unstubAllGlobals();
  });

  it("ikigai requires completed questionnaire before matching", () => {
    expect(validateIkigaiAnswers(completeAnswers)).toEqual({ ok: true, missing: [] });
    expect(toIkigaiAnswers(completeAnswers)).toEqual(completeAnswers);

    const invalid = validateIkigaiAnswers({ ...completeAnswers, strengths: " " });
    expect(invalid.ok).toBe(false);
    expect(invalid.missing).toEqual(["strengths"]);
    expect(toIkigaiAnswers({ ...completeAnswers, strengths: "" })).toBeNull();
  });

  it("ikigai collects allowed isco codes from renderable companies", () => {
    const companies = [
      makeCompany({
        company_id: "a",
        capability_tags: [
          { isco_code: "251", prominence: "core" },
          { isco_code: "243", prominence: "supporting" },
        ],
      }),
      makeCompany({
        company_id: "b",
        capability_tags: [{ isco_code: "251", prominence: "incidental" }],
      }),
    ];

    expect(collectAllowedIkigaiIscoCodes(companies)).toEqual([
      {
        code: "251",
        label: "information and communications technology professionals",
        domains: ["software-it"],
        companyCount: 2,
      },
      {
        code: "243",
        label: "business and administration professionals",
        domains: ["sales-commercial"],
        companyCount: 1,
      },
    ]);
  });

  it("ikigai rejects unknown isco candidates", () => {
    const candidates: IkigaiIscoCandidate[] = [
      { iscoCode: "251", strength: "strong", reason: "software work" },
      { iscoCode: "999", strength: "weak", reason: "not loaded" },
    ];

    expect(filterAllowedIkigaiIscoCandidates(candidates, ["251"])).toEqual([
      { iscoCode: "251", strength: "strong", reason: "software work" },
    ]);
  });

  it("ikigai parses allowed isco candidates", () => {
    const parsed = parseIkigaiIscoCandidates(
      JSON.stringify({
        candidates: [
          { isco_code: "251", strength: "strong", reason: "direct software skills" },
          { isco_code: "243", strength: "weak", reason: "some commercial work" },
        ],
      })
    );

    expect(parsed).toEqual([
      { iscoCode: "251", strength: "strong", reason: "direct software skills" },
      { iscoCode: "243", strength: "weak", reason: "some commercial work" },
    ]);
  });

  it("ikigai recovers from malformed isco response", () => {
    expect(parseIkigaiIscoCandidates("not json")).toBeNull();
    expect(parseIkigaiIscoCandidates(JSON.stringify({ candidates: [{ isco_code: "251", strength: "maybe" }] }))).toBeNull();
  });

  it("ikigai isco prompt constrains output to allowed loaded codes", () => {
    const prompt = buildIscoDerivationPrompt(
      completeAnswers,
      [{ code: "251", label: "ict professionals", domains: ["software-it"], companyCount: 3 }],
      "en"
    );

    expect(prompt).toContain('"allowed_codes"');
    expect(prompt).toContain('"251"');
    expect(prompt).toContain("use only codes from allowed_codes");
    expect(prompt).toContain(completeAnswers.strengths);
  });

  it("ikigai ranks shared isco companies", () => {
    const candidates: IkigaiIscoCandidate[] = [{ iscoCode: "251", strength: "strong", reason: "software work" }];
    const companies = [
      makeCompany({ company_id: "a", name: "a", capability_tags: [{ isco_code: "251", prominence: "core" }] }),
      makeCompany({ company_id: "b", name: "b", capability_tags: [{ isco_code: "243", prominence: "core" }] }),
    ];

    expect(rankIkigaiCompanyCandidates(companies, candidates).map((candidate) => candidate.companyId)).toEqual(["a"]);
  });

  it("ikigai excludes non-overlapping companies", () => {
    const ranked = rankIkigaiCompanyCandidates(
      [makeCompany({ company_id: "nope", capability_tags: [{ isco_code: "243", prominence: "core" }] })],
      [{ iscoCode: "251", strength: "strong", reason: "software work" }]
    );

    expect(ranked).toEqual([]);
  });

  it("ikigai ranks strong core matches ahead", () => {
    const candidates: IkigaiIscoCandidate[] = [
      { iscoCode: "251", strength: "strong", reason: "software work" },
      { iscoCode: "243", strength: "weak", reason: "commercial work" },
    ];
    const companies = [
      makeCompany({ company_id: "supporting", name: "b", capability_tags: [{ isco_code: "243", prominence: "core" }] }),
      makeCompany({ company_id: "core", name: "a", capability_tags: [{ isco_code: "251", prominence: "core" }] }),
      makeCompany({
        company_id: "low-confidence",
        name: "c",
        capability_tags: [{ isco_code: "251", prominence: "core", confidence: "low" }],
      }),
    ];

    expect(rankIkigaiCompanyCandidates(companies, candidates).map((candidate) => candidate.companyId)).toEqual([
      "core",
      "low-confidence",
      "supporting",
    ]);
  });

  it("keeps default axis state available to ikigai tests", () => {
    expect(DEFAULT_AXIS_MINIMUMS.substance).toBe("none");
  });

  it("ikigai large pool can be tightened", () => {
    expect(shouldTightenIkigaiAxisFilters(101)).toBe(true);
    expect(shouldTightenIkigaiAxisFilters(100)).toBe(false);

    const candidates: IkigaiCompanyCandidate[] = [
      {
        companyId: "high",
        company: makeCompany({
          company_id: "high",
          scores: { ...makeCompany().scores, ecology: { score: 80, evidence: "partial" } },
        }),
        score: 3,
        matchedTags: [],
      },
      {
        companyId: "low",
        company: makeCompany({
          company_id: "low",
          scores: { ...makeCompany().scores, ecology: { score: 20, evidence: "partial" } },
        }),
        score: 2,
        matchedTags: [],
      },
    ];

    const axisMinimums = { ...DEFAULT_AXIS_MINIMUMS, ecology: "high" as const };
    expect(getIkigaiAxisFilteredCount(candidates, axisMinimums)).toBe(1);
    expect(applyIkigaiAxisMinimums(candidates, axisMinimums).map((candidate) => candidate.companyId)).toEqual(["high"]);
  });

  it("ikigai axis tightening preserves tags", () => {
    const tags: IkigaiIscoCandidate[] = [{ iscoCode: "251", strength: "strong", reason: "software work" }];
    const preserved = preserveIkigaiIscoCandidatesOnAxisChange(tags);

    expect(preserved).toEqual(tags);
    expect(preserved).not.toBe(tags);
  });

  it("ikigai small pool proceeds without tightening", () => {
    expect(shouldTightenIkigaiAxisFilters(13)).toBe(false);
  });

  it("ikigai builds compact and full prompt profiles from current fields", () => {
    const company = makeCompany({
      company_id: "profiled",
      name: "profiled company",
      capability_tags: [{ isco_code: "251", prominence: "core", confidence: "high" }],
      nl: {
        tagline: "nederlandse tagline",
        scores: {
          substance: { reason: "inhoud reden" },
          ecology: { reason: "ecologie reden" },
          power: { reason: "macht reden" },
          embeddedness: { reason: "verankering reden" },
          posture: { reason: "houding reden" },
        },
      },
    });

    expect(buildIkigaiCompactCompanyProfile(company, "nl")).toMatchObject({
      id: "profiled",
      name: "profiled company",
      tagline: "nederlandse tagline",
      capability_tags: [{ isco_code: "251", prominence: "core", confidence: "high" }],
      axis_levels: { substance: "medium", ecology: "medium", power: "none" },
    });
    expect(buildIkigaiFullCompanyProfile(company, "nl").axes.substance).toEqual({
      score: 50,
      evidence: "partial",
      reason: "inhoud reden",
    });
  });

  it("ikigai pass 1 returns valid candidate ids", () => {
    expect(
      parsePass1CandidateIds(
        JSON.stringify({ candidate_company_ids: ["a", "missing", "b", "a"] }),
        ["a", "b"]
      )
    ).toEqual(["a", "b"]);
  });

  it("ikigai pass 2 returns grounded matches", () => {
    expect(
      parsePass2SelectedMatches(
        JSON.stringify({
          selected_matches: [
            { company_id: "a", reason: "matches the supplied care profile" },
            { company_id: "b", reason: "has relevant axis evidence" },
          ],
        }),
        ["a", "b"]
      )
    ).toEqual([
      { companyId: "a", reason: "matches the supplied care profile" },
      { companyId: "b", reason: "has relevant axis evidence" },
    ]);
  });

  it("ikigai ignores invalid company ids", () => {
    expect(parsePass1CandidateIds(JSON.stringify({ candidate_company_ids: ["a", "x"] }), ["a"])).toEqual(["a"]);
    expect(
      parsePass2SelectedMatches(
        JSON.stringify({ selected_matches: [{ company_id: "x", reason: "invalid" }, { company_id: "a", reason: "valid" }] }),
        ["a"]
      )
    ).toEqual([{ companyId: "a", reason: "valid" }]);
  });

  it("ikigai confirmed byok starts flow", async () => {
    const companies = [
      makeCompany({ company_id: "a", name: "a", capability_tags: [{ isco_code: "251", prominence: "core" }] }),
    ];
    const responses: ByokResult[] = [
      {
        ok: true,
        content: JSON.stringify({
          candidates: [{ isco_code: "251", strength: "strong", reason: "software skills" }],
        }),
        usage: { costSource: "unknown" },
      },
      {
        ok: true,
        content: JSON.stringify({ candidate_company_ids: ["a"] }),
        usage: { costSource: "unknown" },
      },
      {
        ok: true,
        content: JSON.stringify({ selected_matches: [{ company_id: "a", reason: "grounded fit" }] }),
        usage: { costSource: "unknown" },
      },
    ];
    const result = await runIkigaiMatching({
      answers: completeAnswers,
      companies,
      locale: "en",
      sendRequest: async () => responses.shift()!,
      now: () => new Date("2026-06-09T12:00:00.000Z"),
      idFactory: () => "run-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.run.selectedMatches).toEqual([{ companyId: "a", reason: "grounded fit" }]);
    expect(result.run.deterministicCandidateIds).toEqual(["a"]);
  });

  it("ikigai provider error preserves draft", async () => {
    const result = await runIkigaiMatching({
      answers: completeAnswers,
      companies: [makeCompany({ capability_tags: [{ isco_code: "251", prominence: "core" }] })],
      locale: "en",
      sendRequest: async () => ({ ok: false, error: "rate_limited" }),
    });

    expect(result).toEqual({ ok: false, error: "rate_limited", answers: completeAnswers });
  });

  it("ikigai missing byok blocks prompts", async () => {
    let calls = 0;
    const result = await runIkigaiMatching({
      answers: completeAnswers,
      companies: [makeCompany({ capability_tags: [{ isco_code: "251", prominence: "core" }] })],
      locale: "en",
      sendRequest: async () => {
        calls += 1;
        return { ok: false, error: "missing_config" };
      },
    });

    expect(calls).toBe(1);
    expect(result).toEqual({ ok: false, error: "missing_config", answers: completeAnswers });
  });

  it("ikigai empty deterministic pool is shown", async () => {
    const result = await runIkigaiMatching({
      answers: completeAnswers,
      companies: [makeCompany({ capability_tags: [{ isco_code: "243", prominence: "core" }] })],
      locale: "en",
      sendRequest: async () => ({
        ok: true,
        content: JSON.stringify({
          candidates: [{ isco_code: "251", strength: "strong", reason: "software skills" }],
        }),
        usage: { costSource: "unknown" },
      }),
    });

    expect(result).toEqual({ ok: false, error: "empty_candidate_pool", answers: completeAnswers });
  });

  it("ikigai run persists locally", () => {
    stubLocalStorage();
    saveIkigaiRun(makeRun());

    expect(readIkigaiHistory().runs.map((run) => run.id)).toEqual(["run-1"]);
  });

  it("ikigai display uses current company data", () => {
    const run = makeRun();
    const currentCompany = makeCompany({ company_id: "a", name: "current name" });

    expect(resolveIkigaiRunCompanies(run, [currentCompany]).selectedMatches[0].company.name).toBe("current name");
  });

  it("ikigai missing saved companies are hidden", () => {
    const run = makeRun();

    expect(resolveIkigaiRunCompanies(run, [makeCompany({ company_id: "a" })]).selectedMatches).toHaveLength(1);
    expect(resolveIkigaiRunCompanies(run, []).selectedMatches).toEqual([]);
  });

  it("ikigai storage omits secrets and snapshots", () => {
    stubLocalStorage();
    saveIkigaiRun(makeRun());

    const stored = window.localStorage.getItem("de-bedrijfskompas:ikigai:v1") ?? "";
    expect(stored).not.toContain("api");
    expect(stored).not.toContain("sk-");
    expect(stored).not.toContain("current name");
    expect(stored).toContain("run-1");
  });
});
