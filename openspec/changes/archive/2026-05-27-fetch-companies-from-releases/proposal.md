## Why

`src/data/companies.json` was committed as a temporary stand-in. The real source is the sibling `de-bedrijfskompas-pipeline` repo, which publishes a `companies.json` asset on each GitHub release. Committing the file into the frontend bakes in stale data and couples two repos through a manual copy. The frontend should pull the latest release artifact at build time so deploys always carry the freshest pipeline output.

## What Changes

- Add a build-time fetch step that downloads `companies.json` from the most recent release of `floriskappen/de-bedrijfskompas-pipeline` (private repo) using the `gh` CLI for auth.
- Wire the fetch into the `build` script so it runs before `astro build`. Local `dev` may use a cached copy if present, refetching only when missing or explicitly invalidated.
- The fetched file lands at `src/data/companies.json` (gitignored) — the existing build-time accessor in the `company-data` capability keeps reading from the same path, so consumers are unchanged.
- Remove the committed `src/data/companies.json` and add it to `.gitignore`.
- **BREAKING** for local contributors: a fresh checkout now requires `gh auth login` (read access to the pipeline repo) before `npm run build` will succeed.

## Capabilities

### New Capabilities
- `company-data-fetch`: build-time acquisition of the `companies.json` artifact from the pipeline's GitHub releases. Covers release discovery, asset download, authentication, and cache behavior.

### Modified Capabilities
*(none — `company-data` requirements are unchanged; the source path stays the same, only its origin moves from git to a fetched artifact.)*

## Impact

- New build dependency on the `gh` CLI being installed and authenticated in any environment that runs `npm run build` (local dev machines, CI).
- New script (likely `scripts/fetch-companies.mjs`) invoked from `package.json`'s `build` script.
- `src/data/companies.json` is removed from version control and added to `.gitignore`.
- No runtime code changes; the `company-data` accessor keeps its current file-read implementation.
