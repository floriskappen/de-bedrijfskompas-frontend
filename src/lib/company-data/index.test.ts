import { describe, it, expect } from "vitest";
import { validate, getAllCompanies, getCompanyById, getLocalizedField } from "./index";
import { getCompanyTags } from "./filters";
import type { Company } from "./types";

describe("company-data capability", () => {
  // Helper to create a valid minimal company template
  const createValidTemplate = (): any => ({
    company_id: "test-company",
    name: "test company b.v.",
    status: "ok",
    latlng: {
      lat: 52.37,
      lng: 4.89,
    },
    scores: {
      substance: { score: 50, evidence: "partial" },
      ecology: { score: 50, evidence: "partial" },
      power: { score: 50, evidence: "partial" },
      embeddedness: { score: 50, evidence: "partial" },
      posture: { score: 50, evidence: "partial" },
    },
    nl: {
      tagline: "een test tagline.",
      scores: {
        substance: { reason: "reden" },
        ecology: { reason: "reden" },
        power: { reason: "reden" },
        embeddedness: { reason: "reden" },
        posture: { reason: "reden" },
      },
    },
    en: {
      tagline: "a test tagline.",
      scores: {
        substance: { reason: "reason" },
        ecology: { reason: "reason" },
        power: { reason: "reason" },
        embeddedness: { reason: "reason" },
        posture: { reason: "reason" },
      },
    },
  });

  // 12.1 valid record is exposed to the app
  it("valid record is exposed to the app", () => {
    const record = createValidTemplate();
    const result = validate(record);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // 12.2 record missing a required field is dropped
  it("record missing a required field is dropped", () => {
    const record = createValidTemplate();
    delete record.company_id; // missing required field
    const result = validate(record);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("missing required field: company_id");
  });

  it("missing tags behave as empty tags", () => {
    const record = createValidTemplate();
    const result = validate(record);

    expect(result.ok).toBe(true);
    expect(getCompanyTags(record)).toEqual([]);
  });

  it("known tags are preserved", () => {
    const record = createValidTemplate();
    record.capability_tags = [
      { family: "software-engineering", prominence: "core" },
      { family: "commercial", prominence: "supporting" },
    ];

    const result = validate(record);

    expect(result.ok).toBe(true);
    expect(getCompanyTags(record)).toEqual(["software-engineering", "commercial"]);
  });

  it("unknown tags are rejected", () => {
    const record = createValidTemplate();
    record.capability_tags = [
      { family: "software-engineering", prominence: "core" },
      { family: "unknown-tag", prominence: "supporting" },
    ];

    const result = validate(record);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("invalid capability tag family: unknown-tag");
  });

  it("tags are locale-neutral", () => {
    const record = createValidTemplate();
    record.capability_tags = [
      { family: "commercial", prominence: "core" },
      { family: "education-training", prominence: "supporting" },
    ];

    expect(validate(record).ok).toBe(true);
    expect(getCompanyTags(record)).toEqual(["commercial", "education-training"]);
    expect(getLocalizedField(record as Company, "nl", "tagline")).toBe("een test tagline.");
    expect(getLocalizedField(record as Company, "en", "tagline")).toBe("a test tagline.");
    expect(getCompanyTags(record)).toEqual(["commercial", "education-training"]);
  });

  // 12.3 null score is preserved, not coerced
  it("null score is preserved, not coerced", () => {
    const record = createValidTemplate();
    record.scores.power.score = null;
    const result = validate(record);
    expect(result.ok).toBe(true);
    expect(record.scores.power.score).toBeNull();
  });

  // 12.4 invalid coordinates exclude the record
  it("invalid coordinates exclude the record", () => {
    const record = createValidTemplate();
    
    // Test out of range latitude
    record.latlng.lat = 95;
    let result = validate(record);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes("latitude out of range"))).toBe(true);

    // Test out of range longitude
    record.latlng.lat = 52.37;
    record.latlng.lng = 200;
    result = validate(record);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes("longitude out of range"))).toBe(true);

    // Test missing coordinates
    delete record.latlng;
    result = validate(record);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("missing required field: latlng");
  });

  // 12.5 non-ok records do not reach consumers
  it("non-ok records do not reach consumers", () => {
    const companies = getAllCompanies();
    const inactive = companies.find(c => c.company_id === "abbey-games"); // dropped due to null latlng
    expect(inactive).toBeUndefined();
  });

  // 12.6 score values are not duplicated in locale blocks
  it("score values are not duplicated in locale blocks", () => {
    const record = createValidTemplate();
    // Inject a duplicate score inside locale block
    record.nl.scores.substance.score = 80;
    
    const result = validate(record);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes("score values must not be duplicated in locale blocks"))).toBe(true);
  });

  // 12.7 missing translation falls back
  it("missing translation falls back", () => {
    const record = createValidTemplate() as Company;
    // Clear en tagline
    record.en.tagline = "";
    
    const tagline = getLocalizedField(record, "en", "tagline");
    expect(tagline).toBe("een test tagline."); // falls back to nl
  });

  // 12.8 collection accessor returns only renderable companies
  it("collection accessor returns only renderable companies", () => {
    const companies = getAllCompanies();
    expect(companies.length).toBeGreaterThan(0);
    // Ensure all returned companies have status "ok" and valid latlng
    companies.forEach(company => {
      expect(company.status).toBe("ok");
      expect(company.latlng).toBeDefined();
      expect(company.latlng).not.toBeNull();
      expect(company.latlng!.lat).toBeGreaterThanOrEqual(-90);
      expect(company.latlng!.lat).toBeLessThanOrEqual(90);
      expect(company.latlng!.lng).toBeGreaterThanOrEqual(-180);
      expect(company.latlng!.lng).toBeLessThanOrEqual(180);
    });
  });

  // 12.9 lookup by id resolves to a record or undefined
  it("lookup by id resolves to a record or undefined", () => {
    const existing = getCompanyById("2daysmood");
    expect(existing).toBeDefined();
    expect(existing?.company_id).toBe("2daysmood");

    const nonExisting = getCompanyById("abbey-games"); // dropped due to null latlng
    expect(nonExisting).toBeUndefined();

    const fake = getCompanyById("does-not-exist");
    expect(fake).toBeUndefined();
  });
});
