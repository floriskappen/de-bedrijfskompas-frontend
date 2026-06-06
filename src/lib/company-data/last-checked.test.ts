import { describe, expect, it } from "vitest";
import { formatLastChecked } from "./last-checked";

const NOW = new Date("2026-06-18T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe("formats updated_at as localized relative time", () => {
  it("renders day/month/year diffs per locale", () => {
    expect(formatLastChecked(daysAgo(12), "nl", NOW)).toBe("12 dagen geleden");
    expect(formatLastChecked(daysAgo(12), "en", NOW)).toBe("12 days ago");

    expect(formatLastChecked(daysAgo(90), "nl", NOW)).toBe("3 maanden geleden");
    expect(formatLastChecked(daysAgo(90), "en", NOW)).toBe("3 months ago");

    expect(formatLastChecked(daysAgo(730), "nl", NOW)).toBe("2 jaar geleden");
    expect(formatLastChecked(daysAgo(730), "en", NOW)).toBe("2 years ago");
  });

  it("stays lowercase", () => {
    const out = formatLastChecked(daysAgo(5), "nl", NOW)!;
    expect(out).toBe(out.toLowerCase());
  });

  it("returns null for missing or unparseable input", () => {
    expect(formatLastChecked(undefined, "nl", NOW)).toBeNull();
    expect(formatLastChecked(null, "en", NOW)).toBeNull();
    expect(formatLastChecked("", "nl", NOW)).toBeNull();
    expect(formatLastChecked("not-a-date", "en", NOW)).toBeNull();
  });
});
