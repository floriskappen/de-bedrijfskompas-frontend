import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const read = (relativePath: string) => readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("byom constitution consumption", () => {
  it("byom constitution bundle is pinned", () => {
    const gitmodules = read(".gitmodules");
    expect(gitmodules).toContain("path = vendor/byom");
    expect(gitmodules).toContain("url = git@github.com:floriskappen/bring-your-own-model.git");
    expect(gitmodules).toContain("branch = release/v0.1");

    for (const requiredPath of [
      "vendor/byom/AGENTS.md",
      "vendor/byom/VERSION",
      "vendor/byom/CHANGELOG.md",
      "vendor/byom/constitution",
    ]) {
      expect(existsSync(path.join(repoRoot, requiredPath))).toBe(true);
    }

    expect(read("vendor/byom/VERSION").trim()).toBe("v0.1.0");
    expect(
      execFileSync("git", ["-C", "vendor/byom", "rev-parse", "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim()
    ).toBe("e2fc406678cfc48ec967af511e6761407a4120cc");
    expect(
      execFileSync("git", ["-C", "vendor/byom", "describe", "--tags", "--exact-match"], {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim()
    ).toBe("v0.1.0");
  });

  it("byom integration document records current adoption", () => {
    const integration = read("BYOM-INTEGRATION.md");
    expect(integration).toContain("BYOM");
    expect(integration).toContain("v0.1.0");
    expect(integration).toContain("e2fc406");
    expect(integration).toContain("## Deviations");
  });

  it("byom integration document has a propagation log", () => {
    const integration = read("BYOM-INTEGRATION.md");
    expect(integration).toContain("Propagation log");
    expect(integration).toContain("none -> v0.1.0");
  });

  it("byok work has local constitution read path", () => {
    const guidance = read("AGENTS.md");
    expect(guidance).toContain("vendor/byom/");
    expect(guidance).toContain("vendor/byom/AGENTS.md");
    expect(guidance).toContain("constitution/");
    expect(guidance).toContain("BYOM-INTEGRATION.md");
    expect(guidance).toContain("BYOM_STRUGGLES.md");
  });

  it("built page carries a Content-Security-Policy", () => {
    const builtPage = path.join(repoRoot, "dist", "index.html");
    const policy = existsSync(builtPage)
      ? read("dist/index.html").match(/<meta http-equiv="content-security-policy" content="([^"]*)"/u)?.[1] ??
        ""
      : read("astro.config.mjs");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(policy).not.toMatch(/script-src[^;]*\*/);
    expect(policy).toContain("connect-src 'self' https://openrouter.ai https://api.mapbox.com https://*.mapbox.com");
  });

  it("repository carries an open-source license", () => {
    expect(existsSync(path.join(repoRoot, "LICENSE"))).toBe(true);
    const license = read("LICENSE");
    expect(license).toContain("GNU GENERAL PUBLIC LICENSE");
    expect(license).toContain("Version 3, 29 June 2007");

    const pkg = JSON.parse(read("package.json"));
    expect(pkg.license).toBe("GPL-3.0-or-later");
  });
});
