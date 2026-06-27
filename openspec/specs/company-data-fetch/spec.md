# Company Data Fetch

## Purpose

Build-time acquisition of the `companies.json` artifact from the pipeline's GitHub releases. Covers release discovery, asset download, authentication, and cache behavior.
## Requirements
### Requirement: Build-time fetch from latest pipeline release

Before a production build runs, the system SHALL download the `companies.json` asset from the most recent published release of `floriskappen/de-bedrijfskompas-pipeline` and write it to `src/data/companies.json`. "Most recent" means the release returned by GitHub's "latest release" endpoint (the most recently published, non-draft, non-prerelease entry). The downloaded file MUST replace any existing file at that path.

#### Scenario: Production build fetches before astro build

- **WHEN** `npm run build` runs in any environment
- **THEN** the fetch step runs to completion and writes a fresh `src/data/companies.json` before `astro build` is invoked

#### Scenario: Asset is overwritten on each fetch

- **WHEN** the fetch step runs and `src/data/companies.json` already exists from a previous fetch
- **THEN** the previous contents are replaced with the asset from the most recent release

### Requirement: Authentication sources

The pipeline repo is public. The fetch step authenticates opportunistically, in this preference order: (1) the `gh` CLI if it is installed and authenticated for an account with read access to the pipeline repo; (2) a personal access token from `GH_TOKEN` (or `GITHUB_TOKEN` if `GH_TOKEN` is absent); (3) anonymous GitHub REST API access. A token is optional — it raises the unauthenticated rate limit (60 → 5000 req/hr) and is the recommended path for CI — but the build SHALL NOT fail for lack of one while the latest release is reachable anonymously.

#### Scenario: Local developer with gh authenticated

- **WHEN** `gh auth status` reports an authenticated session with repo read access and no `GH_TOKEN` env var is set
- **THEN** the fetch uses `gh` to download the asset

#### Scenario: Netlify build with GH_TOKEN

- **WHEN** the build runs in an environment where `gh` is not installed but `GH_TOKEN` is set to a valid token with read access to the pipeline repo
- **THEN** the fetch uses the token against the GitHub REST API (sending an `Authorization: Bearer …` header) to download the asset

#### Scenario: No auth available (public repo)

- **WHEN** `gh` is not authenticated and neither `GH_TOKEN` nor `GITHUB_TOKEN` is set
- **THEN** the fetch step downloads the asset anonymously via the GitHub REST API (no `Authorization` header) and `astro build` runs

### Requirement: Asset validation

After download, the fetch step SHALL verify that the file is non-empty and parses as JSON. If either check fails, the file MUST NOT remain on disk in a half-written state and the build MUST fail with a message identifying the release tag the asset came from.

#### Scenario: Empty or malformed asset

- **WHEN** the downloaded asset is zero bytes or does not parse as JSON
- **THEN** the fetch step exits non-zero, the destination path is left in its prior state (either absent or its previous contents), and the error message includes the release tag of the failed download

### Requirement: Dev-mode cache reuse

`npm run dev` (and any non-build script that triggers the fetch) SHALL reuse an existing `src/data/companies.json` if one is present and only fetch when the file is absent. An explicit refresh path SHALL be available so a developer can force a refetch without deleting the file by hand.

#### Scenario: Dev with cached data skips network

- **WHEN** `npm run dev` starts and `src/data/companies.json` already exists
- **THEN** no network request is made and the cached file is used as-is

#### Scenario: Forced refresh

- **WHEN** a developer runs the explicit refresh command (e.g. `npm run fetch:data`)
- **THEN** the asset is downloaded from the most recent release, overwriting any cached file

### Requirement: Source of truth and version control

The fetched `src/data/companies.json` SHALL NOT be tracked in version control. The frontend repository MUST NOT contain a committed copy of the pipeline's company data.

#### Scenario: Fresh checkout has no committed data

- **WHEN** a contributor clones the repository
- **THEN** `src/data/companies.json` is absent and `.gitignore` excludes it from being committed if it is later created by the fetch step

## Operational Pitfalls

- The `gh` CLI resolves "latest release" via the dedicated endpoint, which excludes prereleases and drafts. If the pipeline ever publishes a prerelease as its newest version, this fetch will silently use the previous stable release — that's the intended behaviour, but worth knowing when debugging "why didn't my new data show up?".
- A `GH_TOKEN` with no scope for the private pipeline repo will produce a 404 from the releases endpoint, not a 403. Treat 404 from `/repos/floriskappen/de-bedrijfskompas-pipeline/releases/latest` as "auth probably wrong" before assuming the release is missing.
- When both `gh` and `GH_TOKEN` are present, the script uses `gh` and ignores the token. This matters on a developer machine that also has a CI-style token exported — refresh via `gh auth refresh`, not by setting `GH_TOKEN`.
