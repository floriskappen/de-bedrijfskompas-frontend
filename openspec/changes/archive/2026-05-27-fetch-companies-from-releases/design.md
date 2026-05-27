## Context

The pipeline repo (`floriskappen/de-bedrijfskompas-pipeline`, private) publishes a `companies.json` asset on each GitHub release. The frontend currently ships a hand-copied snapshot at `src/data/companies.json`. The `company-data` capability already abstracts read access behind build-time accessors, so swapping the source is local to the build step — no runtime or consumer changes.

The user has `gh` installed and authenticated against an account with read access to the pipeline repo. The frontend is built locally and (eventually) in CI; both environments need a way to authenticate.

## Goals / Non-Goals

**Goals:**
- Pull `companies.json` from the latest release of the pipeline repo before each production build.
- Keep the on-disk path (`src/data/companies.json`) stable so the existing accessor and its tests don't move.
- Make local development friction-free: cache the artifact, skip refetch when present, allow explicit refresh.
- Fail the build loudly with an actionable message when auth or the asset is missing.

**Non-Goals:**
- Runtime fetching from the browser. This is build-time only.
- Pinning to a specific release tag. Always the most recent release.
- A general-purpose asset-mirroring tool. Single asset, single repo.
- Netlify dashboard configuration itself (UI clicks). The script supports the env-var path; the README documents which var to set.

## Decisions

**Use `gh release download` over the REST API.**
`gh release download --repo floriskappen/de-bedrijfskompas-pipeline --pattern companies.json --clobber` resolves "latest release" and handles auth in one shot. Alternative: hit `GET /repos/.../releases/latest` + a second call to download the asset by id with `Accept: application/octet-stream`. The REST path is more code and reimplements what `gh` already does; the `gh` path requires the CLI to be installed, which the user already has and which we can check for with a clear error.

**Run the fetch from a Node script invoked by `package.json`'s `build`.**
`scripts/fetch-companies.mjs` shells out to `gh`, writes to `src/data/companies.json`. Wired as `"build": "node scripts/fetch-companies.mjs && astro build"`. Alternative: an Astro integration hook. Rejected — the fetch is a precondition, not a build-graph participant, and a plain script is easier to run standalone (`npm run fetch:data`).

**Cache strategy: presence-based, with an explicit refresh flag.**
If `src/data/companies.json` exists, `dev` skips refetch. `build` always refetches (production builds should be reproducible against the latest release). A `--force` flag (or `npm run fetch:data`) lets devs refresh on demand. Alternative: ETag/release-tag tracking. Overkill for a single asset on a small team.

**Gitignore the file; commit nothing.**
`src/data/companies.json` moves out of version control. Onboarding docs note the prerequisite (`gh auth login`). Alternative: keep a tiny fixture in-tree for offline dev. Deferred — tests already use their own fixtures (verify in `specs` artifact); if a dev offline path is needed later, add it then.

**Auth fallbacks: `gh` first, `GH_TOKEN` env second.**
The script prefers `gh` (already authenticated for the user). If `gh` is missing or unauthenticated but `GITHUB_TOKEN` / `GH_TOKEN` is set in the environment, fall back to a direct REST download — this is the Netlify path. On Netlify the user will create a fine-scoped personal access token (read access to the pipeline repo) and set it as a build env var named `GH_TOKEN`. If neither auth source is present, the script exits with a message naming both options.

## Risks / Trade-offs

- **[Build now requires network + auth]** → Document the prerequisite in the README and surface a clear error message from the fetch script. Local devs without `gh` see an actionable message, not an Astro stack trace.
- **[Releases without a `companies.json` asset would break builds]** → Script validates that the asset was actually downloaded (non-empty, parses as JSON) before exiting; otherwise fail with the release tag in the message so the pipeline author knows where to look.
- **[Snapshot moves under the dev's feet]** → The data contract is enforced by the `company-data` spec's validation, so a malformed release is caught at build time, not at runtime. The trade-off (vs pinning) is accepted because the project is pre-production.
- **[Coupling builds to a private repo]** → Acceptable for now; both repos are owned by the same person. If the pipeline ever goes public or moves, the script needs one line of config.
