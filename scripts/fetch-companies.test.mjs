import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchCompanies, FetchAuthError, FetchValidationError } from "./fetch-companies.mjs";

const validJson = JSON.stringify({ companies: [] });

function makeWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "fetch-companies-"));
  return {
    dir,
    dest: join(dir, "companies.json"),
    tmp: join(dir, "companies.json.tmp"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function ghRunner({ authed = true, tag = "v1.2.3", payload = validJson }) {
  return vi.fn((args) => {
    if (args[0] === "auth" && args[1] === "status") {
      return { status: authed ? 0 : 1, stdout: "", stderr: "" };
    }
    if (args[0] === "release" && args[1] === "view") {
      return { status: 0, stdout: JSON.stringify({ tagName: tag }), stderr: "" };
    }
    if (args[0] === "release" && args[1] === "download") {
      const outIdx = args.indexOf("--output");
      const outPath = args[outIdx + 1];
      writeFileSync(outPath, payload);
      return { status: 0, stdout: "", stderr: "" };
    }
    return { status: 1, stdout: "", stderr: "unexpected gh call" };
  });
}

function silentLogs() {
  return { log: vi.fn(), errorLog: vi.fn() };
}

describe("fetchCompanies", () => {
  let ws;
  beforeEach(() => { ws = makeWorkspace(); });
  afterEach(() => { ws.cleanup(); });

  it("fetches via gh when gh is authenticated (build path)", async () => {
    const runGh = ghRunner({ authed: true, tag: "v9.9.9" });
    const result = await fetchCompanies({
      argv: [],
      env: {},
      dest: ws.dest,
      tmp: ws.tmp,
      runGh,
      ...silentLogs(),
    });
    expect(result.releaseTag).toBe("v9.9.9");
    expect(JSON.parse(readFileSync(ws.dest, "utf8"))).toEqual({ companies: [] });
    expect(existsSync(ws.tmp)).toBe(false);
  });

  it("falls back to REST when gh is not authenticated but GH_TOKEN is set (netlify path)", async () => {
    const runGh = ghRunner({ authed: false });
    const httpFetch = vi.fn(async (url, opts) => {
      if (url.endsWith("/releases/latest")) {
        expect(opts.headers.Authorization).toBe("Bearer test-token");
        return {
          ok: true,
          status: 200,
          json: async () => ({
            tag_name: "v2.0.0",
            assets: [{ name: "companies.json", url: "https://api.github.com/asset/42" }],
          }),
        };
      }
      if (url === "https://api.github.com/asset/42") {
        expect(opts.headers.Accept).toBe("application/octet-stream");
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => new TextEncoder().encode(validJson).buffer,
        };
      }
      throw new Error("unexpected url " + url);
    });

    const result = await fetchCompanies({
      argv: [],
      env: { GH_TOKEN: "test-token" },
      dest: ws.dest,
      tmp: ws.tmp,
      runGh,
      httpFetch,
      ...silentLogs(),
    });
    expect(result.releaseTag).toBe("v2.0.0");
    expect(readFileSync(ws.dest, "utf8")).toBe(validJson);
  });

  it("exits with FetchAuthError when no auth is available", async () => {
    const runGh = ghRunner({ authed: false });
    await expect(
      fetchCompanies({
        argv: [],
        env: {},
        dest: ws.dest,
        tmp: ws.tmp,
        runGh,
        ...silentLogs(),
      }),
    ).rejects.toBeInstanceOf(FetchAuthError);
    expect(existsSync(ws.dest)).toBe(false);
  });

  it("fails validation when the downloaded asset is empty", async () => {
    const runGh = ghRunner({ authed: true, tag: "v3.0.0", payload: "" });
    await expect(
      fetchCompanies({
        argv: [],
        env: {},
        dest: ws.dest,
        tmp: ws.tmp,
        runGh,
        ...silentLogs(),
      }),
    ).rejects.toBeInstanceOf(FetchValidationError);
    expect(existsSync(ws.tmp)).toBe(false);
    expect(existsSync(ws.dest)).toBe(false);
  });

  it("fails validation when the downloaded asset is not json", async () => {
    const runGh = ghRunner({ authed: true, tag: "v3.1.0", payload: "not json {{" });
    await expect(
      fetchCompanies({
        argv: [],
        env: {},
        dest: ws.dest,
        tmp: ws.tmp,
        runGh,
        ...silentLogs(),
      }),
    ).rejects.toBeInstanceOf(FetchValidationError);
    expect(existsSync(ws.tmp)).toBe(false);
  });

  it("preserves prior dest contents when validation fails", async () => {
    writeFileSync(ws.dest, JSON.stringify({ companies: [{ id: "prior" }] }));
    const runGh = ghRunner({ authed: true, payload: "" });
    await expect(
      fetchCompanies({
        argv: ["--force"],
        env: {},
        dest: ws.dest,
        tmp: ws.tmp,
        runGh,
        ...silentLogs(),
      }),
    ).rejects.toBeInstanceOf(FetchValidationError);
    expect(JSON.parse(readFileSync(ws.dest, "utf8"))).toEqual({ companies: [{ id: "prior" }] });
  });

  it("--skip-if-exists returns early when dest is present", async () => {
    writeFileSync(ws.dest, validJson);
    const runGh = vi.fn(() => { throw new Error("should not be called"); });
    const result = await fetchCompanies({
      argv: ["--skip-if-exists"],
      env: {},
      dest: ws.dest,
      tmp: ws.tmp,
      runGh,
      ...silentLogs(),
    });
    expect(result.skipped).toBe(true);
    expect(runGh).not.toHaveBeenCalled();
  });

  it("--force refetches even when dest is present", async () => {
    writeFileSync(ws.dest, JSON.stringify({ stale: true }));
    const runGh = ghRunner({ authed: true, tag: "v4.0.0" });
    const result = await fetchCompanies({
      argv: ["--force", "--skip-if-exists"],
      env: {},
      dest: ws.dest,
      tmp: ws.tmp,
      runGh,
      ...silentLogs(),
    });
    expect(result.skipped).toBe(false);
    expect(result.releaseTag).toBe("v4.0.0");
    expect(readFileSync(ws.dest, "utf8")).toBe(validJson);
  });
});

describe(".gitignore", () => {
  it("excludes the fetched companies.json", () => {
    const contents = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
    expect(contents).toMatch(/^src\/data\/companies\.json$/m);
  });
});
