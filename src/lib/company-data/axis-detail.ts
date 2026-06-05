import type { AxisId, EvidenceLevel } from "./types";
import { t } from "../i18n";

// Shape of the moon glyph that signals how well an axis is evidenced:
// full = well evidenced, half = partial, empty = no signal.
export type MoonType = "full" | "half" | "empty";

const MOON_BY_EVIDENCE: Record<EvidenceLevel, MoonType> = {
  well_evidenced: "full",
  partial: "half",
  no_signal: "empty",
};

const EVIDENCE_MESSAGE_KEY = {
  well_evidenced: "evidence_well",
  partial: "evidence_partial",
  no_signal: "evidence_none",
} as const;

export function getMoonType(evidence: EvidenceLevel): MoonType {
  return MOON_BY_EVIDENCE[evidence];
}

export function getEvidenceLabel(evidence: EvidenceLevel, locale: string): string {
  return t(EVIDENCE_MESSAGE_KEY[evidence], locale);
}

// Per-axis info page lives at a language-neutral axis id under a localized
// prefix. These routes are a forward reference — they 404 until the
// axis-info-pages change ships.
export function getAxisInfoHref(axis: AxisId, locale: string): string {
  return locale === "en" ? `/en/axis/${axis}/` : `/as/${axis}/`;
}
