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

  if (skipIfExists && !force && existsSync(dest) && statSync(dest).size > 0) {
    log(`[fetch-companies] using cached ${dest}`);
    return { skipped: true };
  }

  mkdirSync(dirname(dest), { recursive: true });

  const ghAvailable = isGhAuthenticated(runGh);
  const token = env.GH_TOKEN || env.GITHUB_TOKEN;

  if (!ghAvailable && !token) {
    errorLog(
      [
        "[fetch-companies] no github auth available.",
        "  • locally: run `gh auth login` (account must have read access to " + REPO + ")",
        "  • on netlify/ci: set the GH_TOKEN env var to a personal access token with repo read access",
      ].join("\n"),
    );
    throw new FetchAuthError("no github auth available");
  }

  let releaseTag = "<unknown>";
  try {
    if (ghAvailable) {
      releaseTag = await fetchWithGh({ runGh, tmp, log });
    } else {
      releaseTag = await fetchWithRest({ httpFetch, token, tmp, log });
    }

    validateDownloaded(tmp, releaseTag);
    renameSync(tmp, dest);
    log(`[fetch-companies] wrote ${dest} (release ${releaseTag})`);
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

async function fetchWithGh({ runGh, tmp, log }) {
  log(`[fetch-companies] using gh cli`);
  const view = runGh([
    "release", "view", "--repo", REPO, "--json", "tagName",
  ]);
  if (view.status !== 0) {
    throw new Error(`gh release view failed: ${view.stderr?.trim() || "exit " + view.status}`);
  }
  const tag = JSON.parse(view.stdout).tagName;

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
  return tag;
}

async function fetchWithRest({ httpFetch, token, tmp, log }) {
  log(`[fetch-companies] using github rest api`);
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "de-bedrijfskompas-frontend",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const releaseRes = await httpFetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { ...headers, Accept: "application/vnd.github+json" },
  });
  if (releaseRes.status === 404) {
    throw new FetchAuthError(
      `release lookup returned 404 — GH_TOKEN likely lacks read access to ${REPO}`,
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

  const assetRes = await httpFetch(asset.url, {
    headers: { ...headers, Accept: "application/octet-stream" },
    redirect: "follow",
  });
  if (!assetRes.ok) {
    throw new Error(`asset download failed: ${assetRes.status} ${assetRes.statusText}`);
  }
  const buf = Buffer.from(await assetRes.arrayBuffer());
  writeFileSync(tmp, buf);
  return tag;
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
