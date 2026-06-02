export type AxisId = "substance" | "ecology" | "power" | "embeddedness" | "posture";

export type EvidenceLevel = "well_evidenced" | "partial" | "no_signal";

export const AXIS_IDS: AxisId[] = ["substance", "ecology", "power", "embeddedness", "posture"];

export const TAG_IDS = [
  "software-engineering",
  "data-ai",
  "hardware-electronics",
  "mechanical-civil-engineering",
  "life-sciences",
  "earth-environmental-sciences",
  "clinical-care",
  "design-creative",
  "content-media",
  "commercial",
  "finance-accounting",
  "legal-compliance",
  "policy-public-administration",
  "operations-supply-chain",
  "people-org",
  "field-trades-operators",
  "education-training",
  "service-hospitality",
  "community-social",
] as const;

export type TagId = (typeof TAG_IDS)[number];

export type TagProminence = "core" | "supporting" | "incidental";

export interface ScoreDetail {
  score: number | null;
  evidence: EvidenceLevel;
}

export type Scores = Record<AxisId, ScoreDetail>;

export interface Address {
  street: string;
  postcode: string;
  city: string;
  country: string;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface AxisProse {
  reason: string;
}

export interface LocaleBlock {
  tagline: string;
  scores: Record<AxisId, AxisProse>;
}

export interface CapabilityTag {
  family: TagId;
  prominence: TagProminence;
}

export interface Company {
  company_id: string;
  name: string;
  website?: string;
  favicon_url?: string;
  status: string;
  address?: Address;
  latlng?: Coords | null;
  capability_tags: CapabilityTag[];
  scores: Scores;
  nl: LocaleBlock;
  en: LocaleBlock;
}
