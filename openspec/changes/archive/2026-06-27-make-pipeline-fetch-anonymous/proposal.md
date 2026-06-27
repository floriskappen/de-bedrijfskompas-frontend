## Why

The pipeline repo `floriskappen/de-bedrijfskompas-pipeline` is now public, so the build-time fetch of `companies.json` no longer needs GitHub authentication. The current `company-data-fetch` spec mandates auth (gh CLI or `GH_TOKEN`) and requires the build to fail when neither is present — an artificial gate now that anonymous GitHub REST access can reach the latest release. Removing the hard auth requirement lets the app deploy on Netlify (and any CI) with zero secret configuration, while keeping `GH_TOKEN` as an optional rate-limit raiser.

## What Changes

- The fetch step authenticates **opportunistically**, not mandatorily: `gh` CLI → `GH_TOKEN`/`GITHUB_TOKEN` → anonymous REST, in that preference order.
- Anonymous access becomes a compliant path: when no auth source is available, the fetch proceeds against the GitHub REST API without an `Authorization` header instead of failing before `astro build`.
- `GH_TOKEN` remains supported and recommended for CI (60 → 5000 req/hr), but is no longer required.
- The 404 pitfall note is reworded to cover the anonymous case (a private/inaccessible repo anon-returns 404 the same way a scoped-out token does).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `company-data-fetch`: the authentication requirement changes from "at least one source MUST succeed or the build fails" to "auth is opportunistic; anonymous access is a compliant path for the public repo." The "No usable auth available" scenario flips from fail-fast to fetch-anonymously.

## Impact

- **Code:** `scripts/fetch-companies.mjs` — drop the `FetchAuthError` throw on missing auth; make the `Authorization` header conditional on a token being present; reword the 404 error.
- **Tests:** `scripts/fetch-companies.test.mjs` — replace the "no auth → throws" test with a "no auth → fetches anonymously" test; the REST test keeps its `Authorization: Bearer …` assertion for the token path.
- **Spec:** `openspec/specs/company-data-fetch/spec.md` — the Authentication requirement, the "No usable auth" scenario, and the 404 pitfall note.
- **Deploy:** `netlify.toml` no longer needs a `GH_TOKEN` env var (already absent from the toml; this change removes the last implicit dependency).
- **Data contract:** unchanged — the fetch target (`companies.json` from the latest release) and its validation are untouched.
