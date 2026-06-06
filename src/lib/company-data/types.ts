export type AxisId = "substance" | "ecology" | "power" | "embeddedness" | "posture";

export type EvidenceLevel = "well_evidenced" | "partial" | "no_signal";

export const AXIS_IDS: AxisId[] = ["substance", "ecology", "power", "embeddedness", "posture"];

export const DOMAIN_GROUP_IDS = [
  "education-training",
  "health-care",
  "engineering-technical",
  "software-it",
  "science-research",
  "business-finance-admin",
  "sales-commercial",
  "creative-media-culture",
  "legal-policy",
  "trades-construction",
  "production-logistics",
  "agriculture-environment",
  "hospitality-personal-service",
  "management-leadership",
  "public-safety-defense",
] as const;

export type DomainGroupId = (typeof DOMAIN_GROUP_IDS)[number];

export type TagProminence = "core" | "supporting" | "incidental";
export type TagConfidence = "high" | "low";

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
  isco_code: string;
  prominence: TagProminence;
  confidence?: TagConfidence;
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
  // ISO 8601 (UTC) timestamps emitted by the pipeline; optional pass-through.
  created_at?: string;
  updated_at?: string;
}
