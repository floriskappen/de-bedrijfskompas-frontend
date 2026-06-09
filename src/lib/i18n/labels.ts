import type { AxisId, DomainGroupId } from "../company-data/types";
import type { FocusLevel } from "../company-data/focus-level";

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

// Focus levels read as how much focus a company puts on an axis, never as
// good/bad. `none` reuses the site's no-signal wording. The same label is used
// in the filter slider and on the detail axis rows.
const FOCUS_LEVEL_LABELS: Record<Locale, Record<FocusLevel, string>> = {
  nl: {
    none: "geen signaal",
    low: "weinig focus",
    medium: "gemiddelde focus",
    high: "veel focus",
  },
  en: {
    none: "no signal",
    low: "little focus",
    medium: "moderate focus",
    high: "much focus",
  },
};

// Filter minimums read as "at least this much focus" — a minimum of `low`
// includes every company from weinig focus upward, not only the weinig band.
// `none` means no preference; `high` is already the ceiling so it stands alone.
const FOCUS_MINIMUM_LABELS: Record<Locale, Record<FocusLevel, string>> = {
  nl: {
    none: "geen voorkeur",
    low: "minstens weinig focus",
    medium: "minstens gemiddelde focus",
    high: "veel focus",
  },
  en: {
    none: "any",
    low: "at least little focus",
    medium: "at least moderate focus",
    high: "much focus",
  },
};

export function getAxisLabel(axis: AxisId, locale: string): string {
  return AXIS_LABELS[normalizeLocale(locale)][axis];
}

export function getFocusLevelLabel(level: FocusLevel, locale: string): string {
  return FOCUS_LEVEL_LABELS[normalizeLocale(locale)][level];
}

export function getFocusMinimumLabel(level: FocusLevel, locale: string): string {
  return FOCUS_MINIMUM_LABELS[normalizeLocale(locale)][level];
}

export function getDomainGroupLabel(domain: DomainGroupId, locale: string): string {
  return DOMAIN_GROUP_LABELS[normalizeLocale(locale)][domain];
}
