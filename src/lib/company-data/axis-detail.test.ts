import { describe, expect, it } from "vitest";
import { AXIS_IDS } from "./types";
import { getAxisInfoHref, getEvidenceLabel, getMoonType } from "./axis-detail";

describe("evidence presentation", () => {
  it("maps each evidence level to a moon glyph", () => {
    expect(getMoonType("well_evidenced")).toBe("full");
    expect(getMoonType("partial")).toBe("half");
    expect(getMoonType("no_signal")).toBe("empty");
  });

  it("labels each evidence level per locale, lowercase", () => {
    for (const locale of ["nl", "en"]) {
      const labels = [
        getEvidenceLabel("well_evidenced", locale),
        getEvidenceLabel("partial", locale),
        getEvidenceLabel("no_signal", locale),
      ];
      // distinct, non-empty, lowercase
      expect(new Set(labels).size).toBe(3);
      for (const l of labels) {
        expect(l).toBeTruthy();
        expect(l).toBe(l.toLowerCase());
      }
    }
    expect(getEvidenceLabel("no_signal", "nl")).toBe("geen signaal");
    expect(getEvidenceLabel("no_signal", "en")).toBe("no signal");
  });
});

describe("axis info-page links", () => {
  it("builds axis info-page links per locale", () => {
    for (const axis of AXIS_IDS) {
      expect(getAxisInfoHref(axis, "nl")).toBe(`/as/${axis}/`);
      expect(getAxisInfoHref(axis, "en")).toBe(`/en/axis/${axis}/`);
    }
  });
});
