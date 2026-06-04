import type { AxisId, DomainGroupId } from "../company-data/types";

type Locale = "nl" | "en";

const normalizeLocale = (locale: string): Locale => (locale === "en" ? "en" : "nl");

// Compass axis names. These are product-defining terms; the dutch wording was
// chosen to match the tone of the score prose in the company data.
const AXIS_LABELS: Record<Locale, Record<AxisId, string>> = {
  nl: {
    substance: "inhoud",
    ecology: "ecologie",
    power: "macht",
    embeddedness: "verankering",
    posture: "houding",
  },
  en: {
    substance: "substance",
    ecology: "ecology",
    power: "power",
    embeddedness: "embeddedness",
    posture: "posture",
  },
};

// Projected work fields, kept short enough to read as filter chips.
const DOMAIN_GROUP_LABELS: Record<Locale, Record<DomainGroupId, string>> = {
  nl: {
    "education-training": "onderwijs",
    "health-care": "zorg",
    "engineering-technical": "techniek",
    "software-it": "software/ict",
    "science-research": "onderzoek",
    "business-finance-admin": "business/admin",
    "sales-commercial": "sales",
    "creative-media-culture": "creatief/media",
    "legal-policy": "recht/beleid",
    "trades-construction": "vakwerk/bouw",
    "production-logistics": "productie/logistiek",
    "agriculture-environment": "landbouw/milieu",
    "hospitality-personal-service": "horeca/service",
    "management-leadership": "leiding",
    "public-safety-defense": "veiligheid/defensie",
  },
  en: {
    "education-training": "education",
    "health-care": "health/care",
    "engineering-technical": "engineering",
    "software-it": "software/it",
    "science-research": "science",
    "business-finance-admin": "business/admin",
    "sales-commercial": "sales",
    "creative-media-culture": "creative/media",
    "legal-policy": "legal/policy",
    "trades-construction": "trades/building",
    "production-logistics": "production/logistics",
    "agriculture-environment": "agriculture/environment",
    "hospitality-personal-service": "hospitality/service",
    "management-leadership": "management",
    "public-safety-defense": "safety/defense",
  },
};

export function getAxisLabel(axis: AxisId, locale: string): string {
  return AXIS_LABELS[normalizeLocale(locale)][axis];
}

export function getDomainGroupLabel(domain: DomainGroupId, locale: string): string {
  return DOMAIN_GROUP_LABELS[normalizeLocale(locale)][domain];
}
