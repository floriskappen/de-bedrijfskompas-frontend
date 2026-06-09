// Frontend-only projection of a numeric axis score (0–100, or null) onto a
// named "focus level" — how much focus a company puts on an axis, not how good
// it is. This is a presentation layer over the pipeline scores; the stored
// values stay numeric.

export type FocusLevel = "none" | "low" | "medium" | "high";

// The pentagon draws reference rings at these fractional radii. The upper two
// double as the focus-level band boundaries, so a plotted axis dot visibly
// lands inside the band named by its level.
export const PENTAGON_RING_FRACTIONS = [0.33, 0.66, 1] as const;

// Lower-inclusive score boundaries: low [0,33) · medium [33,66) · high [66,100].
export const FOCUS_LEVEL_THRESHOLDS = {
  medium: Math.round(PENTAGON_RING_FRACTIONS[0] * 100), // 33
  high: Math.round(PENTAGON_RING_FRACTIONS[1] * 100), // 66
} as const;

// Ascending order; the index doubles as the comparison ordinal. `none` sits at
// the bottom so a null-score company never satisfies a `low`-or-higher minimum.
export const FOCUS_LEVEL_ORDER: FocusLevel[] = ["none", "low", "medium", "high"];

export function focusLevelOrdinal(level: FocusLevel): number {
  return FOCUS_LEVEL_ORDER.indexOf(level);
}

export function getFocusLevel(score: number | null | undefined): FocusLevel {
  if (typeof score !== "number") return "none";
  if (score >= FOCUS_LEVEL_THRESHOLDS.high) return "high";
  if (score >= FOCUS_LEVEL_THRESHOLDS.medium) return "medium";
  return "low";
}
