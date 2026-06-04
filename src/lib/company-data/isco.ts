import type { CapabilityTag, DomainGroupId } from "./types";

export const ISCO_SUB_MAJOR_CODES = [
  "11",
  "12",
  "13",
  "14",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "31",
  "32",
  "33",
  "34",
  "35",
  "41",
  "42",
  "43",
  "44",
  "51",
  "52",
  "53",
  "54",
  "61",
  "62",
  "63",
  "71",
  "72",
  "73",
  "74",
  "75",
  "81",
  "82",
  "83",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "01",
  "02",
  "03",
] as const;

export type IscoSubMajorCode = (typeof ISCO_SUB_MAJOR_CODES)[number];

const ISCO_SUB_MAJOR_CODE_SET = new Set<string>(ISCO_SUB_MAJOR_CODES);

export const ISCO_SUB_MAJOR_LABELS: Record<IscoSubMajorCode, string> = {
  "11": "chief executives, senior officials and legislators",
  "12": "administrative and commercial managers",
  "13": "production and specialised services managers",
  "14": "hospitality, retail and other services managers",
  "21": "science and engineering professionals",
  "22": "health professionals",
  "23": "teaching professionals",
  "24": "business and administration professionals",
  "25": "information and communications technology professionals",
  "26": "legal, social and cultural professionals",
  "31": "science and engineering associate professionals",
  "32": "health associate professionals",
  "33": "business and administration associate professionals",
  "34": "legal, social, cultural and related associate professionals",
  "35": "information and communications technicians",
  "41": "general and keyboard clerks",
  "42": "customer services clerks",
  "43": "numerical and material recording clerks",
  "44": "other clerical support workers",
  "51": "personal service workers",
  "52": "sales workers",
  "53": "personal care workers",
  "54": "protective services workers",
  "61": "market-oriented skilled agricultural workers",
  "62": "market-oriented skilled forestry, fishery and hunting workers",
  "63": "subsistence farmers, fishers, hunters and gatherers",
  "71": "building and related trades workers",
  "72": "metal, machinery and related trades workers",
  "73": "handicraft and printing workers",
  "74": "electrical and electronic trades workers",
  "75": "food processing, wood working, garment and other craft trades",
  "81": "stationary plant and machine operators",
  "82": "assemblers",
  "83": "drivers and mobile plant operators",
  "91": "cleaners and helpers",
  "92": "agricultural, forestry and fishery labourers",
  "93": "labourers in mining, construction, manufacturing, transport",
  "94": "food preparation assistants",
  "95": "street and related sales and service workers",
  "96": "refuse workers and other elementary workers",
  "01": "commissioned armed forces officers",
  "02": "non-commissioned armed forces officers",
  "03": "armed forces, other ranks",
};

export const SUB_MAJOR_DOMAIN_GROUPS: Record<IscoSubMajorCode, readonly DomainGroupId[]> = {
  "11": ["management-leadership", "legal-policy"],
  "12": ["management-leadership", "business-finance-admin", "sales-commercial"],
  "13": ["management-leadership"],
  "14": ["management-leadership", "hospitality-personal-service", "sales-commercial"],
  "21": ["science-research", "engineering-technical"],
  "22": ["health-care"],
  "23": ["education-training"],
  "24": ["business-finance-admin"],
  "25": ["software-it"],
  "26": ["legal-policy", "creative-media-culture", "science-research"],
  "31": ["engineering-technical", "science-research"],
  "32": ["health-care"],
  "33": ["business-finance-admin", "sales-commercial"],
  "34": ["legal-policy", "creative-media-culture", "education-training", "health-care"],
  "35": ["software-it"],
  "41": ["business-finance-admin"],
  "42": ["sales-commercial"],
  "43": ["business-finance-admin", "production-logistics"],
  "44": ["business-finance-admin"],
  "51": ["hospitality-personal-service"],
  "52": ["sales-commercial"],
  "53": ["health-care", "education-training"],
  "54": ["public-safety-defense"],
  "61": ["agriculture-environment"],
  "62": ["agriculture-environment"],
  "63": ["agriculture-environment"],
  "71": ["trades-construction"],
  "72": ["trades-construction", "engineering-technical"],
  "73": ["trades-construction", "creative-media-culture"],
  "74": ["trades-construction", "engineering-technical"],
  "75": ["trades-construction", "production-logistics"],
  "81": ["production-logistics"],
  "82": ["production-logistics"],
  "83": ["production-logistics"],
  "91": ["hospitality-personal-service"],
  "92": ["agriculture-environment"],
  "93": ["production-logistics", "trades-construction"],
  "94": ["hospitality-personal-service"],
  "95": ["sales-commercial", "hospitality-personal-service"],
  "96": ["production-logistics"],
  "01": ["public-safety-defense"],
  "02": ["public-safety-defense"],
  "03": ["public-safety-defense"],
};

// Minor-level precision for sub-major groups that span multiple domains. When
// absent, the complete sub-major projection above is used as a future-proof
// fallback for valid ISCO-08 minor codes.
const MINOR_DOMAIN_GROUPS: Record<string, readonly DomainGroupId[]> = {
  "111": ["management-leadership", "legal-policy"],
  "112": ["management-leadership"],
  "121": ["management-leadership", "business-finance-admin"],
  "122": ["management-leadership", "sales-commercial"],
  "131": ["management-leadership", "agriculture-environment"],
  "132": ["management-leadership", "production-logistics", "trades-construction"],
  "133": ["management-leadership", "software-it"],
  "141": ["management-leadership", "hospitality-personal-service"],
  "142": ["management-leadership", "sales-commercial"],
  "211": ["science-research"],
  "212": ["science-research"],
  "213": ["science-research"],
  "214": ["engineering-technical"],
  "215": ["engineering-technical"],
  "216": ["engineering-technical", "creative-media-culture"],
  "241": ["business-finance-admin"],
  "242": ["business-finance-admin"],
  "243": ["sales-commercial"],
  "261": ["legal-policy"],
  "262": ["creative-media-culture", "science-research"],
  "263": ["legal-policy", "health-care"],
  "264": ["creative-media-culture"],
  "265": ["creative-media-culture"],
  "331": ["business-finance-admin"],
  "332": ["sales-commercial"],
  "333": ["business-finance-admin", "sales-commercial"],
  "334": ["business-finance-admin"],
  "335": ["legal-policy"],
  "341": ["legal-policy"],
  "342": ["hospitality-personal-service", "health-care"],
  "343": ["creative-media-culture", "hospitality-personal-service"],
  "431": ["business-finance-admin"],
  "432": ["production-logistics"],
  "531": ["education-training", "health-care"],
  "532": ["health-care"],
  "731": ["creative-media-culture", "trades-construction"],
  "732": ["creative-media-culture", "trades-construction"],
  "741": ["trades-construction", "engineering-technical"],
  "742": ["trades-construction", "engineering-technical"],
  "751": ["trades-construction", "production-logistics"],
  "752": ["trades-construction", "production-logistics"],
  "753": ["trades-construction", "production-logistics"],
  "754": ["trades-construction", "production-logistics"],
  "921": ["agriculture-environment"],
  "931": ["production-logistics", "trades-construction"],
  "932": ["production-logistics"],
  "933": ["production-logistics"],
};

export function getIscoSubMajorCode(iscoCode: string): IscoSubMajorCode | null {
  if (!/^\d{3}$/.test(iscoCode)) return null;

  const subMajor = iscoCode.slice(0, 2);
  return ISCO_SUB_MAJOR_CODE_SET.has(subMajor) ? (subMajor as IscoSubMajorCode) : null;
}

export function getDomainGroupsForIscoCode(iscoCode: string): DomainGroupId[] {
  const subMajor = getIscoSubMajorCode(iscoCode);
  if (!subMajor) return [];

  return [...(MINOR_DOMAIN_GROUPS[iscoCode] ?? SUB_MAJOR_DOMAIN_GROUPS[subMajor])];
}

export function getDomainGroupsForCapabilityTags(
  capabilityTags: readonly Pick<CapabilityTag, "isco_code">[]
): DomainGroupId[] {
  const seen = new Set<DomainGroupId>();

  for (const tag of capabilityTags) {
    for (const domain of getDomainGroupsForIscoCode(tag.isco_code)) {
      seen.add(domain);
    }
  }

  return [...seen];
}

export function getUnmappedSubMajorCodes(): IscoSubMajorCode[] {
  return ISCO_SUB_MAJOR_CODES.filter((code) => SUB_MAJOR_DOMAIN_GROUPS[code].length === 0);
}
