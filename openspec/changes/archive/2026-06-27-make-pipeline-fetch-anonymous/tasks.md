## 1. Fetch script

- [x] 1.1 In `scripts/fetch-companies.mjs`, replace the `if (!haveAuth)` block that throws `FetchAuthError` with a log line ("no github auth — fetching anonymously") and fall through to the existing REST path.
- [x] 1.2 In `resolveLatestWithRest`, build the request headers without `Authorization` by default and add `Authorization: Bearer <token>` only when `token` is truthy.
- [x] 1.3 Reword the 404 `FetchAuthError` message to cover the anonymous case ("may not exist, may be private, or the token if set lacks read access"); keep `FetchAuthError` as the 404 error type.

## 2. Tests

- [x] 2.1 In `scripts/fetch-companies.test.mjs`, replace "exits with FetchAuthError when no auth is available" with "fetches anonymously when neither gh nor GH_TOKEN is available (public repo path)" — assert the release-lookup request carries no `Authorization` header and the asset is written.
- [x] 2.2 Keep the "falls back to REST when gh is not authenticated but GH_TOKEN is set" test asserting `Authorization: Bearer test-token` (unchanged) so the token path stays covered.

## 3. Deploy config & verification

- [x] 3.1 Confirm `netlify.toml` requires no `GH_TOKEN` (it does not set one); update the GH_TOKEN comment to mark it optional/recommended-only.
- [x] 3.2 Run `npx vitest run scripts/fetch-companies.test.mjs` and the full `npx vitest run` suite; confirm green.
- [x] 3.3 Confirm no other code or doc asserts that `GH_TOKEN` is required at build time (search the repo, excluding `vendor/` and archived OpenSpec changes).
