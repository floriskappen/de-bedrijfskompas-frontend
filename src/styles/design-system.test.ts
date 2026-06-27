import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (relativePath: string) => readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("ontwerp design-system consumption", () => {
  it("design-system bundle is pinned", () => {
    const gitmodules = read(".gitmodules");
    expect(gitmodules).toContain("path = vendor/ontwerp");
    expect(gitmodules).toContain("url = git@github.com:floriskappen/ontwerpsysteem.git");
    expect(gitmodules).toContain("branch = release");

    for (const requiredPath of [
      "vendor/ontwerp/AGENTS.md",
      "vendor/ontwerp/VERSION",
      "vendor/ontwerp/CHANGELOG.md",
      "vendor/ontwerp/values",
      "vendor/ontwerp/recipes",
      "vendor/ontwerp/language",
      "vendor/ontwerp/zoo",
    ]) {
      expect(existsSync(path.join(repoRoot, requiredPath))).toBe(true);
    }

    expect(read("vendor/ontwerp/VERSION").trim()).toBe("0.1.1");
    expect(
      execFileSync("git", ["-C", "vendor/ontwerp", "rev-parse", "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim()
    ).toBe("2010627104916aa7e0dd7658e5d0c9c1bf89e3d2");
    expect(
      execFileSync("git", ["-C", "vendor/ontwerp", "describe", "--tags", "--exact-match"], {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim()
    ).toBe("v0.1.1");
  });

  it("design pin records current adoption", () => {
    const designPin = read("docs/DESIGN.md");
    expect(designPin).toContain("**System:** ontwerp design system");
    expect(designPin).toContain("**Pinned version:** 0.1.1");
    expect(designPin).toContain("**Pinned commit:** 2010627104916aa7e0dd7658e5d0c9c1bf89e3d2");
    expect(designPin).toContain("**Submodule path:** vendor/ontwerp");
    expect(designPin).toContain("## Adopted");
    expect(designPin).toContain("### Adapted");
    expect(designPin).toContain("### Omitted");
    expect(designPin).toContain("### Extended");
    expect(designPin).toContain("## Propagation log");
    expect(designPin).toContain("none -> 0.1.0");
  });

  it("ui work has local design read path", () => {
    const guidance = read("AGENTS.md");
    expect(guidance).toContain("vendor/ontwerp/");
    expect(guidance).toContain("docs/DESIGN.md");
    expect(guidance).toContain("vendor/ontwerp/AGENTS.md");
    expect(guidance).toContain("vendor/ontwerp/language/");
    expect(guidance).toContain("vendor/ontwerp/recipes/");
    expect(guidance).toContain("vendor/ontwerp/zoo/");
    expect(guidance).toContain("vendor/ontwerp/values/");
  });

  it("ontwerp values are imported", () => {
    const globalCss = read("src/styles/global.css");
    expect(globalCss).toContain('@import "../../vendor/ontwerp/values/css/tokens.css";');
    expect(globalCss).toContain('@import "../../vendor/ontwerp/values/tailwind/theme.css";');
    expect(globalCss).toContain('url("../../vendor/ontwerp/fonts/archivo-latin.woff2")');
    expect(globalCss).toContain('url("../../vendor/ontwerp/fonts/jetbrains-mono-latin.woff2")');
    expect(globalCss).not.toContain("fonts.googleapis.com");
    expect(globalCss).toContain("--color-paper: var(--color-surface-page);");
    expect(globalCss).toContain("--color-ink: var(--color-text-default);");
    expect(globalCss).toContain("--color-red: var(--color-accent-base);");
  });
});
