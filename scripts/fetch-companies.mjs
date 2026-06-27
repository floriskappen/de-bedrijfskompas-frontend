#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "floriskappen/de-bedrijfskompas-pipeline";
const ASSET = "companies.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const DEST = resolve(PROJECT_ROOT, "src/data/companies.json");
const TMP = `${DEST}.tmp`;

// Records the release tag the cached asset came from, so `--skip-if-exists`
// can tell a current cache apart from a stale one.
const releaseMetaPath = (dest) => `${dest}.release`;

export async function fetchCompanies({
  argv = [],
  env = process.env,
  dest = DEST,
  tmp = TMP,
  log = console.log,
  errorLog = console.error,
  runGh = defaultRunGh,
  httpFetch = globalThis.fetch,
} = {}) {
  const force = argv.includes("--force");
  const skipIfExists = argv.includes("--skip-if-exists");
  const meta = releaseMetaPath(dest);

  mkdirSync(dirname(dest), { recursive: true });

  const cachedAvailable = existsSync(dest) && statSync(dest).size > 0;
  const ghAvailable = isGhAuthenticated(runGh);
  const token = env.GH_TOKEN || env.GITHUB_TOKEN;
  const haveAuth = ghAvailable || token;

  // Tag-aware skip: keep the cache only when it matches the latest release.
  // The check fetches release metadata, not the asset, so it stays cheap.
  if (skipIfExists && !force && cachedAvailable) {
    if (!haveAuth) {
      log(`[fetch-companies] using cached ${dest} (no github auth to check for updates)`);
      return { skipped: true };
    }
    try {
      const { tag, download } = await resolveLatest({ ghAvailable, runGh, token, httpFetch, log });
      const cachedTag = readCachedTag(meta);
      if (cachedTag && cachedTag === tag) {
        log(`[fetch-companies] cached ${dest} is up to date (release ${tag})`);
        return { skipped: true, releaseTag: tag };
      }
      log(`[fetch-companies] refetching: cached release ${cachedTag ?? "<unknown>"} → latest ${tag}`);
      await writeFetched({ download, tmp, dest, meta, tag, log });
      return { skipped: false, releaseTag: tag };
    } catch (err) {
      safeUnlink(tmp);
      // The update check failed (offline, transient, bad asset) — the cache is
      // still usable, so keep serving it rather than breaking dev/test.
      errorLog(`[fetch-companies] could not refresh, using cached ${dest}: ${err.message}`);
      return { skipped: true };
    }
  }

  if (!haveAuth) {
    log("[fetch-companies] no github auth — fetching anonymously (the pipeline repo is public)");
  }

  let releaseTag = "<unknown>";
  try {
    const { tag, download } = await resolveLatest({ ghAvailable, runGh, token, httpFetch, log });
    releaseTag = tag;
    await writeFetched({ download, tmp, dest, meta, tag, log });
    return { skipped: false, releaseTag };
  } catch (err) {
    safeUnlink(tmp);
    if (err instanceof FetchValidationError || err instanceof FetchAuthError) throw err;
    errorLog(`[fetch-companies] failed (release ${releaseTag}): ${err.message}`);
    throw err;
  }
}

export class FetchAuthError extends Error {}
export class FetchValidationError extends Error {}

function defaultRunGh(args, opts = {}) {
  return spawnSync("gh", args, { encoding: "utf8", ...opts });
}

function isGhAuthenticated(runGh) {
  const probe = runGh(["auth", "status"], { stdio: "ignore" });
  return probe.status === 0;
}

async function writeFetched({ download, tmp, dest, meta, tag, log }) {
  await download(tmp);
  validateDownloaded(tmp, tag);
  renameSync(tmp, dest);
  writeCachedTag(meta, tag);
  log(`[fetch-companies] wrote ${dest} (release ${tag})`);
}

// Resolves the latest release's tag plus a lazy `download(tmp)` for its asset,
// so callers can compare tags before paying for the asset transfer.
async function resolveLatest({ ghAvailable, runGh, token, httpFetch, log }) {
  if (ghAvailable) {
    log(`[fetch-companies] using gh cli`);
    const view = runGh(["release", "view", "--repo", REPO, "--json", "tagName"]);
    if (view.status !== 0) {
      throw new Error(`gh release view failed: ${view.stderr?.trim() || "exit " + view.status}`);
    }
    const tag = JSON.parse(view.stdout).tagName;
    return { tag, download: (tmp) => downloadWithGh({ runGh, tmp }) };
  }

  log(`[fetch-companies] using github rest api`);
  return resolveLatestWithRest({ httpFetch, token });
}

function downloadWithGh({ runGh, tmp }) {
  const download = runGh([
    "release", "download",
    "--repo", REPO,
    "--pattern", ASSET,
    "--output", tmp,
    "--clobber",
  ]);
  if (download.status !== 0) {
    throw new Error(`gh release download failed: ${download.stderr?.trim() || "exit " + download.status}`);
  }
}

async function resolveLatestWithRest({ httpFetch, token }) {
  const headers = {
    "User-Agent": "de-bedrijfskompas-frontend",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const releaseRes = await httpFetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { ...headers, Accept: "application/vnd.github+json" },
  });
  if (releaseRes.status === 404) {
    throw new FetchAuthError(
      `release lookup returned 404 — ${REPO} may not exist, may be private, or the token (if set) lacks read access`,
    );
  }
  if (!releaseRes.ok) {
    throw new Error(`release lookup failed: ${releaseRes.status} ${releaseRes.statusText}`);
  }
  const release = await releaseRes.json();
  const tag = release.tag_name ?? "<unknown>";
  const asset = (release.assets ?? []).find((a) => a.name === ASSET);
  if (!asset) {
    throw new Error(`release ${tag} has no asset named ${ASSET}`);
  }

  return {
    tag,
    download: async (tmp) => {
      const assetRes = await httpFetch(asset.url, {
        headers: { ...headers, Accept: "application/octet-stream" },
        redirect: "follow",
      });
      if (!assetRes.ok) {
        throw new Error(`asset download failed: ${assetRes.status} ${assetRes.statusText}`);
      }
      const buf = Buffer.from(await assetRes.arrayBuffer());
      writeFileSync(tmp, buf);
    },
  };
}

function readCachedTag(metaPath) {
  try {
    return readFileSync(metaPath, "utf8").trim() || null;
  } catch {
    return null;
  }
}

function writeCachedTag(metaPath, tag) {
  try {
    writeFileSync(metaPath, `${tag}\n`);
  } catch {
    // Non-fatal: the asset is written; we just lose the staleness hint.
  }
}

function validateDownloaded(tmp, releaseTag) {
  if (!existsSync(tmp) || statSync(tmp).size === 0) {
    throw new FetchValidationError(
      `downloaded asset for release ${releaseTag} is empty`,
    );
  }
  try {
    JSON.parse(readFileSync(tmp, "utf8"));
  } catch (err) {
    throw new FetchValidationError(
      `downloaded asset for release ${releaseTag} is not valid json: ${err.message}`,
    );
  }
}

function safeUnlink(path) {
  try {
    rmSync(path, { force: true });
  } catch {
    // ignore
  }
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  fetchCompanies({ argv: process.argv.slice(2) }).catch(() => {
    process.exit(1);
  });
}
