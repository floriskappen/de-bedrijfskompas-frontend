## MODIFIED Requirements

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
