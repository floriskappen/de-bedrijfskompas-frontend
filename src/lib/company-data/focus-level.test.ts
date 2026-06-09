import { describe, expect, it } from "vitest";
import {
  FOCUS_LEVEL_THRESHOLDS,
  PENTAGON_RING_FRACTIONS,
  getFocusLevel,
} from "./focus-level";
import { getFocusLevelLabel } from "../i18n/labels";

describe("focus-level projection", () => {
  it("getFocusLevel maps scores to bands", () => {
    expect(getFocusLevel(12)).toBe("low");
    expect(getFocusLevel(32)).toBe("low");
    expect(getFocusLevel(33)).toBe("medium");
    expect(getFocusLevel(65)).toBe("medium");
    expect(getFocusLevel(66)).toBe("high");
    expect(getFocusLevel(100)).toBe("high");
  });

  it("getFocusLevel maps null to none", () => {
    expect(getFocusLevel(null)).toBe("none");
    expect(getFocusLevel(undefined)).toBe("none");
    expect(getFocusLevel(0)).toBe("low");
  });

  it("focus level thresholds match pentagon ring radii", () => {
    expect(FOCUS_LEVEL_THRESHOLDS.medium).toBe(Math.round(PENTAGON_RING_FRACTIONS[0] * 100));
    expect(FOCUS_LEVEL_THRESHOLDS.high).toBe(Math.round(PENTAGON_RING_FRACTIONS[1] * 100));
  });

  it("getFocusLevelLabel returns localized lowercase labels", () => {
    const all = (locale: string) =>
      (["none", "low", "medium", "high"] as const).map((level) => getFocusLevelLabel(level, locale));

    for (const label of [...all("nl"), ...all("en")]) {
      expect(label).toBe(label.toLowerCase());
      expect(label.length).toBeGreaterThan(0);
    }

    expect(getFocusLevelLabel("high", "nl")).toBe("veel focus");
    expect(getFocusLevelLabel("high", "en")).toBe("much focus");
    expect(getFocusLevelLabel("none", "nl")).toBe("geen signaal");
  });
});
