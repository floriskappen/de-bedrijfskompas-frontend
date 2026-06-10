import type { Company } from "../company-data/types";
import {
  getDomainGroupsForIscoCode,
  getIscoSubMajorCode,
  ISCO_SUB_MAJOR_LABELS,
} from "../company-data/isco";
import type {
  IkigaiAllowedIscoCode,
  IkigaiCompanyCandidate,
  IkigaiIscoCandidate,
  IkigaiIscoStrength,
  IkigaiMatchedTag,
} from "./types";

const USER_STRENGTH_WEIGHTS: Record<IkigaiIscoStrength, number> = {
  strong: 3,
  weak: 1,
};

const COMPANY_PROMINENCE_WEIGHTS: Record<Company["capability_tags"][number]["prominence"], number> = {
  core: 3,
  supporting: 2,
  incidental: 1,
};

const COMPANY_CONFIDENCE_WEIGHTS: Record<"high" | "low", number> = {
  high: 1,
  low: 0.5,
};

export function collectAllowedIkigaiIscoCodes(companies: Company[]): IkigaiAllowedIscoCode[] {
  const counts = new Map<string, number>();

  for (const company of companies) {
    const seenForCompany = new Set<string>();
    for (const tag of company.capability_tags) {
      if (!getIscoSubMajorCode(tag.isco_code)) continue;
      seenForCompany.add(tag.isco_code);
    }
    for (const code of seenForCompany) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([code, companyCount]) => {
      const subMajor = getIscoSubMajorCode(code);
      return {
        code,
        label: subMajor ? ISCO_SUB_MAJOR_LABELS[subMajor] : code,
        domains: getDomainGroupsForIscoCode(code),
        companyCount,
      };
    })
    .sort((a, b) => b.companyCount - a.companyCount || a.code.localeCompare(b.code));
}

export function filterAllowedIkigaiIscoCandidates(
  candidates: IkigaiIscoCandidate[],
  allowedCodes: Iterable<string>
): IkigaiIscoCandidate[] {
  const allowed = new Set(allowedCodes);
  const seen = new Set<string>();
  const filtered: IkigaiIscoCandidate[] = [];

  for (const candidate of candidates) {
    if (!allowed.has(candidate.iscoCode) || seen.has(candidate.iscoCode)) continue;
    seen.add(candidate.iscoCode);
    filtered.push(candidate);
  }

  return filtered;
}

function scoreMatchedTag(
  userStrength: IkigaiIscoStrength,
  prominence: Company["capability_tags"][number]["prominence"],
  confidence: Company["capability_tags"][number]["confidence"] | undefined
): number {
  return (
    USER_STRENGTH_WEIGHTS[userStrength] *
    COMPANY_PROMINENCE_WEIGHTS[prominence] *
    COMPANY_CONFIDENCE_WEIGHTS[confidence ?? "high"]
  );
}

export function rankIkigaiCompanyCandidates(
  companies: Company[],
  iscoCandidates: IkigaiIscoCandidate[]
): IkigaiCompanyCandidate[] {
  const userCandidateByCode = new Map(iscoCandidates.map((candidate) => [candidate.iscoCode, candidate]));
  const ranked: IkigaiCompanyCandidate[] = [];

  for (const company of companies) {
    const matchedTags: IkigaiMatchedTag[] = [];

    for (const tag of company.capability_tags) {
      const userCandidate = userCandidateByCode.get(tag.isco_code);
      if (!userCandidate) continue;

      matchedTags.push({
        iscoCode: tag.isco_code,
        userStrength: userCandidate.strength,
        companyProminence: tag.prominence,
        companyConfidence: tag.confidence ?? "high",
        score: scoreMatchedTag(userCandidate.strength, tag.prominence, tag.confidence),
      });
    }

    if (matchedTags.length === 0) continue;

    ranked.push({
      company,
      companyId: company.company_id,
      matchedTags,
      score: matchedTags.reduce((sum, tag) => sum + tag.score, 0),
    });
  }

  return ranked.sort((a, b) => b.score - a.score || a.company.name.localeCompare(b.company.name));
}
