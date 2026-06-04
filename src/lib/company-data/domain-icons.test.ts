import { describe, expect, it } from "vitest";
import { DOMAIN_GROUP_IDS } from "./types";
import { DOMAIN_ICON_PATHS } from "./domain-icons";

describe("domain icon paths", () => {
  it("covers every domain group", () => {
    expect(Object.keys(DOMAIN_ICON_PATHS).sort()).toEqual([...DOMAIN_GROUP_IDS].sort());
  });

  it("does not reuse icon paths between domain groups", () => {
    const paths = Object.values(DOMAIN_ICON_PATHS);

    expect(new Set(paths).size).toBe(paths.length);
  });
});
