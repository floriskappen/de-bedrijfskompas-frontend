export type AxisId = "substance" | "ecology" | "power" | "embeddedness" | "posture";

export type EvidenceLevel = "well_evidenced" | "partial" | "no_signal";

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

export interface Company {
  company_id: string;
  name: string;
  website?: string;
  status: string;
  address?: Address;
  latlng?: Coords | null;
  scores: Scores;
  nl: LocaleBlock;
  en: LocaleBlock;
}
