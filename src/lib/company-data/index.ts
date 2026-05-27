import type { Company, AxisId } from "./types";
import rawCompanies from "../../data/companies.json";

const AXIS_IDS: AxisId[] = ["substance", "ecology", "power", "embeddedness", "posture"];

export function loadRaw(): Record<string, any>[] {
  return rawCompanies;
}

export function validate(record: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!record || typeof record !== "object") {
    return { ok: false, errors: ["record is not an object"] };
  }

  // Required top-level fields
  const requiredFields = ["company_id", "name", "status", "latlng", "scores", "nl", "en"];
  for (const field of requiredFields) {
    if (!(field in record)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Enforce status is "ok"
  if (record.status !== "ok") {
    errors.push(`status is not "ok" (found "${record.status}")`);
  }

  // Enforce latlng is not null/undefined and is a valid coordinates object
  const latlng = record.latlng;
  if (!latlng || typeof latlng !== "object" || typeof latlng.lat !== "number" || typeof latlng.lng !== "number") {
    errors.push("latlng must be an object with lat and lng numbers");
  } else {
    if (latlng.lat < -90 || latlng.lat > 90) {
      errors.push(`latitude out of range: ${latlng.lat}`);
    }
    if (latlng.lng < -180 || latlng.lng > 180) {
      errors.push(`longitude out of range: ${latlng.lng}`);
    }
  }

  // Enforce scores structure
  const scores = record.scores;
  if (!scores || typeof scores !== "object") {
    errors.push("scores must be an object");
  } else {
    for (const axis of AXIS_IDS) {
      if (!(axis in scores)) {
        errors.push(`missing score for axis: ${axis}`);
      } else {
        const detail = scores[axis];
        if (!detail || typeof detail !== "object" || !("score" in detail) || !("evidence" in detail)) {
          errors.push(`invalid score detail structure for axis: ${axis}`);
        } else {
          // score check
          if (detail.score !== null && (typeof detail.score !== "number" || detail.score < 0 || detail.score > 100)) {
            errors.push(`score for axis ${axis} must be an integer in [0, 100] or null`);
          }
          // evidence check
          const validEvidence = ["well_evidenced", "partial", "no_signal"];
          if (!validEvidence.includes(detail.evidence)) {
            errors.push(`evidence for axis ${axis} must be one of [${validEvidence.join(", ")}]`);
          }
        }
      }
    }
  }

  // Enforce i18n blocks and assert no duplicate scores/evidence
  for (const locale of ["nl", "en"]) {
    const localeBlock = record[locale];
    if (localeBlock && typeof localeBlock === "object") {
      if (localeBlock.scores && typeof localeBlock.scores === "object") {
        for (const key of Object.keys(localeBlock.scores)) {
          const axisScore = localeBlock.scores[key];
          if (axisScore && typeof axisScore === "object") {
            if ("score" in axisScore || "evidence" in axisScore) {
              errors.push(`score values must not be duplicated in locale blocks under ${locale}.scores.${key}`);
            }
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function getAllCompanies(): Company[] {
  const rawRecords = loadRaw();
  const companies: Company[] = [];

  for (const record of rawRecords) {
    const { ok, errors } = validate(record);
    if (ok) {
      companies.push(record as Company);
    } else {
      console.warn(`[build warning] dropping company "${record?.company_id || "unknown"}": ${errors.join(", ")}`);
    }
  }

  return companies;
}

export function getCompanyById(id: string): Company | undefined {
  const companies = getAllCompanies();
  return companies.find((c) => c.company_id === id);
}

/**
 * Resolves a nested path in an object
 */
function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => {
    return acc && typeof acc === "object" ? acc[part] : undefined;
  }, obj);
}

export function getLocalizedField(record: Company, locale: string, fieldPath: string): any {
  const primaryLocale = locale === "en" ? "en" : "nl";
  const fallbackLocale = primaryLocale === "en" ? "nl" : "en";

  const primaryValue = getByPath(record[primaryLocale], fieldPath);
  if (primaryValue !== undefined && primaryValue !== null && primaryValue !== "") {
    return primaryValue;
  }

  return getByPath(record[fallbackLocale], fieldPath);
}


