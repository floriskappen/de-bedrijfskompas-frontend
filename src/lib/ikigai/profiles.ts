import { AXIS_IDS, type AxisId, type CapabilityTag, type Company } from "../company-data/types";
import { getFocusLevel } from "../company-data/focus-level";
import type { IkigaiLocale } from "./types";

interface LocaleText {
  tagline?: string;
  scores?: Partial<Record<AxisId, { reason?: string }>>;
}

export interface IkigaiCompactCompanyProfile {
  id: string;
  name: string;
  tagline: string;
  capability_tags: CapabilityTag[];
  axis_levels: Record<AxisId, string>;
}

export interface IkigaiFullCompanyProfile extends IkigaiCompactCompanyProfile {
  axes: Record<AxisId, {
    score: number | null;
    evidence: string;
    reason: string;
  }>;
}

function getLocaleText(company: Company, locale: IkigaiLocale): LocaleText {
  const primary = company[locale] as LocaleText;
  const fallback = company[locale === "en" ? "nl" : "en"] as LocaleText;
  return {
    tagline: primary?.tagline || fallback?.tagline || "",
    scores: primary?.scores ?? fallback?.scores ?? {},
  };
}

export function buildIkigaiCompactCompanyProfile(
  company: Company,
  locale: IkigaiLocale
): IkigaiCompactCompanyProfile {
  const text = getLocaleText(company, locale);
  const axisLevels = AXIS_IDS.reduce(
    (levels, axis) => {
      levels[axis] = getFocusLevel(company.scores[axis]?.score);
      return levels;
    },
    {} as Record<AxisId, string>
  );

  return {
    id: company.company_id,
    name: company.name,
    tagline: text.tagline ?? "",
    capability_tags: company.capability_tags,
    axis_levels: axisLevels,
  };
}

export function buildIkigaiFullCompanyProfile(company: Company, locale: IkigaiLocale): IkigaiFullCompanyProfile {
  const compact = buildIkigaiCompactCompanyProfile(company, locale);
  const text = getLocaleText(company, locale);
  const axes = AXIS_IDS.reduce(
    (profile, axis) => {
      profile[axis] = {
        score: company.scores[axis]?.score ?? null,
        evidence: company.scores[axis]?.evidence ?? "no_signal",
        reason: text.scores?.[axis]?.reason ?? "",
      };
      return profile;
    },
    {} as IkigaiFullCompanyProfile["axes"]
  );

  return { ...compact, axes };
}

export function buildIkigaiCompactCompanyProfiles(
  companies: Company[],
  locale: IkigaiLocale
): IkigaiCompactCompanyProfile[] {
  return companies.map((company) => buildIkigaiCompactCompanyProfile(company, locale));
}

export function buildIkigaiFullCompanyProfiles(
  companies: Company[],
  locale: IkigaiLocale
): IkigaiFullCompanyProfile[] {
  return companies.map((company) => buildIkigaiFullCompanyProfile(company, locale));
}
