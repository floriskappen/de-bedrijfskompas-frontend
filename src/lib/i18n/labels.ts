import type { AxisId, TagId } from "../company-data/types";

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

// Capability tag families, kept short enough to read as filter chips.
const TAG_LABELS: Record<Locale, Record<TagId, string>> = {
  nl: {
    "software-engineering": "software",
    "data-ai": "data/ai",
    "hardware-electronics": "hardware",
    "mechanical-civil-engineering": "techniek",
    "life-sciences": "biowetenschappen",
    "earth-environmental-sciences": "milieu",
    "clinical-care": "zorg",
    "design-creative": "ontwerp",
    "content-media": "media",
    commercial: "commercieel",
    "finance-accounting": "financiën",
    "legal-compliance": "juridisch",
    "policy-public-administration": "beleid",
    "operations-supply-chain": "logistiek",
    "people-org": "mensen",
    "field-trades-operators": "vakwerk",
    "education-training": "onderwijs",
    "service-hospitality": "service",
    "community-social": "gemeenschap",
  },
  en: {
    "software-engineering": "software",
    "data-ai": "data/ai",
    "hardware-electronics": "hardware",
    "mechanical-civil-engineering": "engineering",
    "life-sciences": "life sciences",
    "earth-environmental-sciences": "earth",
    "clinical-care": "care",
    "design-creative": "design",
    "content-media": "media",
    commercial: "commercial",
    "finance-accounting": "finance",
    "legal-compliance": "legal",
    "policy-public-administration": "policy",
    "operations-supply-chain": "operations",
    "people-org": "people",
    "field-trades-operators": "field trades",
    "education-training": "education",
    "service-hospitality": "service",
    "community-social": "community",
  },
};

export function getAxisLabel(axis: AxisId, locale: string): string {
  return AXIS_LABELS[normalizeLocale(locale)][axis];
}

export function getTagLabel(tag: TagId, locale: string): string {
  return TAG_LABELS[normalizeLocale(locale)][tag];
}
