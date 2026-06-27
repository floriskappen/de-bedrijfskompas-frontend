## Context

`scripts/fetch-companies.mjs` fetches `src/data/companies.json` from the latest release of `floriskappen/de-bedrijfskompas-pipeline` before every `astro build`. The data file is gitignored, so the fetch is mandatory for a production build. The pipeline repo was private when the script was written, so the script gates on authentication (gh CLI or `GH_TOKEN`) before any network call and throws `FetchAuthError` if neither is present. The repo is now public, which means GitHub's REST API and asset downloads are reachable anonymously. The current auth gate is therefore an artificial blocker for deploys — Netlify cannot run `gh` and would need a configured secret just to satisfy a guard, not because the data is inaccessible.

## Goals / Non-Goals

**Goals:**
- Let the fetch succeed with no GitHub authentication configured, against the now-public pipeline repo.
- Keep `GH_TOKEN` working as an optional rate-limit raiser and as the path for any future private/pipeline-adjacent repo.
- Keep the gh CLI as the first-choice path on developer machines.
- Keep asset validation, cache reuse, and `--skip-if-exists`/`--force` behavior unchanged.

**Non-Goals:**
- Changing the fetch target, the release-discovery endpoint, or the data contract.
- Removing `GH_TOKEN` support or the `gh` CLI path.
- Adding a fallback data source (e.g. a committed stale snapshot) — the cache-reuse path already covers "fetch failed, keep serving."
- Changing rate-limit handling beyond "token if present, anonymous otherwise."

## Decisions

### Opportunistic auth, not mandatory

Drop the `haveAuth` guard that throws `FetchAuthError` when neither `gh` nor a token is available. When no auth source resolves, fall through to the existing REST path (`resolveLatestWithRest`) with no `Authorization` header. GitHub serves public-repo releases anonymously, so this is a single conditional: include `Authorization: Bearer <token>` only when `token` is truthy. The preference order (gh → token → anonymous) is preserved by the existing branch structure — the only change is that the `!haveAuth` branch no longer throws, and the REST headers are built conditionally.

*Alternative considered:* gate on a `--allow-anonymous` flag to preserve the old fail-fast behavior by default. Rejected — the repo is public, so the old default is now wrong; a flag would push deploy-time configuration into the build command for no benefit.

### Keep `FetchAuthError` for the 404 path

The class is no longer thrown pre-flight, but a 404 from `/releases/latest` still means "repo inaccessible to this identity (or lack of one)." Keep `FetchAuthError` as the 404 error type and reword its message to cover the anonymous case ("repo may not exist, may be private, or the token if set lacks read access"). This preserves the existing error taxonomy and the `--skip-if-exists` cache-on-failure path, which catches `FetchAuthError` alongside other errors.

### No new env var or config

Introducing a `PIPELINE_PUBLIC`/`ALLOW_ANONYMOUS` flag would be configuration for a fact that is already true (the repo is public). The script infers the public posture from "no auth available" — if that ever becomes wrong again, the 404 path surfaces it with a clear message. No `netlify.toml` or `package.json` change is needed for this change.

## Risks / Trade-offs

- [Anonymous rate limit is 60 req/hr per IP] → Acceptable: a build makes one release-lookup + one asset download (2 requests). Only repeated failed builds on a shared CI IP would approach the limit, and `GH_TOKEN` remains the escape hatch. Documented in the spec as the reason a token is "recommended for CI."
- [A future revert to private silently breaks anonymous builds] → The 404 path returns `FetchAuthError` with a message naming "private repo / token lacks access," and `--skip-if-exists` keeps serving the cache on a transient failure. The break is loud and recoverable, not silent.
- [Test naming drift] → The existing test "exits with FetchAuthError when no auth is available" encodes the old contract. It is replaced with a "fetches anonymously" test; the `FetchAuthError` class is still exercised indirectly by the 404 path, so the class stays tested.
