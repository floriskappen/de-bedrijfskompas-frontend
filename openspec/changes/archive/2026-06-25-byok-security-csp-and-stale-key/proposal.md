## Why

The BYOK layer meets several BYOM security invariants but three load-bearing gaps remain open (recorded in `BYOM-INTEGRATION.md`): there is no Content-Security-Policy anywhere in the app (invariant 3), the third-party-JS surface is unaudited (invariant 4), and a provider 401 surfaces an `invalid_key` error without clearing the stale in-memory key or prompting re-connect (`03` "When a request fails"). These are the gaps a determined attacker or a revoked key would exploit first, so they close before the budget/onboarding work (D, F).

## What Changes

- Add a **strict Content-Security-Policy** via Astro's `experimental.csp` config, emitted as a host-agnostic `<meta http-equiv="content-security-policy">` tag in the document head. Astro auto-hashes bundled inline scripts/styles so `script-src` stays hash-locked (no `'unsafe-inline'`). The policy uses a closed `connect-src` allowlist (the provider + Mapbox origins only) and accommodates Mapbox's runtime needs (blob workers, injected styles) as recorded, justified concessions — no `'unsafe-eval'`, no wildcard origins.
- On a provider auth failure (`invalid_key`, 401/403), **clear the stale key** from the session and persisted state and surface a re-connect prompt; do not retry silently. The `BYOK_CHANGED_EVENT` already in the storage layer is the seam the UI subscribes to.
- **Audit the third-party JS** runtime surface (Mapbox GL, React, supercluster, Astro runtime, Tailwind build-time) and record the justification in `BYOM-INTEGRATION.md`'s key-handling section.
- Resolve invariants 3, 4, and 5 and the stale-key deviation in `BYOM-INTEGRATION.md`; log any constitution-level friction to `BYOM_STRUGGLES.md`.

## Capabilities

### New Capabilities

<!-- none — no new capability is introduced -->

### Modified Capabilities

- `bring-your-own-key-llm`: adds a strict-CSP requirement (header present, closed connect-src, no unsafe-inline scripts) and a stale-key-cleared-on-auth-failure requirement (401 clears session + persisted key, no silent retry, re-connect surfaced).
- `byom-consumption`: extends the conformance scenario to assert the CSP is present in the build output alongside the pin and `BYOM-INTEGRATION.md`.

## Impact

- **Code:** `astro.config.mjs` (csp directives); `src/lib/byok/storage.ts` (production key-clear + persisted-key wipe); `src/lib/byok/client.ts` (clear + emit on `invalid_key`); `src/components/ByokSetupDialog.tsx` and/or `IkigaiFlowDialog.tsx` (re-connect prompt reacting to the cleared state). Ontwerp values/components reused for any new UI; no new raw tokens.
- **Specs:** delta to `bring-your-own-key-llm` and `byom-consumption`.
- **Docs:** `BYOM-INTEGRATION.md` (resolve inv 3/4/5 + stale-key deviation, record CSP concessions and the JS audit); `BYOM_STRUGGLES.md` (friction, if any).
- **Data contract with the pipeline:** untouched.
- **Host:** no lock-in — the CSP ships in HTML, so any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages) enforces it.
- **Tests:** unit (401 clears key, single fetch, no retry); a build-output assertion that the CSP meta tag is present (extends the `byom-consumption` test).
