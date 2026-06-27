## 1. Constitution pin + integration document

- [x] 1.1 Fetch v1.2.0 and check out the `vendor/byom` submodule at tag `v1.2.0` (commit `a531d3540cf4db9222b61e744f2ebe4a09858e01`)
- [x] 1.2 Re-walk the v1.1.0→v1.2.0 changelog slice (badge redesign + themeable inline mark; no invariant/contract/schema change) and confirm no implementation code is forced
- [x] 1.3 Update `docs/BYOM-INTEGRATION.md`: pinned version `v1.1.0`→`v1.2.0`, pinned commit `468b47d`→`a531d35`, add a `v1.1.0 -> v1.2.0` propagation-log entry, and close the badge-display deviation (registry-listing deviation stays)
- [x] 1.4 Update `src/lib/byom/byom-consumption.test.ts` pin assertions to `v1.2.0` / `a531d3540cf4db9222b61e744f2ebe4a09858e01` / propagation log `v1.1.0 -> v1.2.0`

## 2. Canonical badge on the about page (byom-badge R1–R3)

- [x] 2.1 Copy `byom-badge-light-small.svg` from `vendor/byom/website/public/assets/badge/` into `public/assets/byom/` (self-host; identical bytes)
- [x] 2.2 Add the honest-claim string (lowercase) to the philosophy content for nl and en in `src/lib/i18n/info-content.ts`
- [x] 2.3 Add the badge `<img>` (canonical alt, `rel="noopener"` link to `https://byom.flkp.nl/`) and the honest-claim prose to `src/components/Philosophy.astro`

## 3. Bare themeable mark in the BYOK connection surface (byom-badge R4)

- [x] 3.1 Inline the `byom-mark-currentColor.svg` markup into the `ByokSetupDialog` header as a `currentColor`-themed affordance (no link, no trust-claim alt; presentational only)

## 4. Verification

- [x] 4.1 Run the test suite (`npm test` / vitest) and the `byom-consumption` conformance test in particular
- [x] 4.2 Run typecheck and lint
- [x] 4.3 Build the site and confirm the CSP is unchanged (`img-src`/`default-src` stays `'self'`; no `https://byom.flkp.nl` origin added) and the badge `<img>` loads from `'self'`
- [x] 4.4 `openspec validate display-byom-badge --strict`
