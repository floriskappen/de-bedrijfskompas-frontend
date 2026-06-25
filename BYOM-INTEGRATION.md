# BYOM-INTEGRATION

How `de-bedrijfskompas` implements the BYOM (Bring Your Own Model) constitution pinned at `vendor/byom`. Authored by following `vendor/byom/constitution/05-integration-guide.md`. The constitution is the authority; this document records the app-specific implementation, conformance state, and deviations.

This app's internal name for the layer is **BYOK** ("bring your own *key*"); the constitution is model-centric (**BYOM**). They refer to the same integration — see Deviations.

## App name and one-line description

**de-bedrijfskompas** — a free, accountless Dutch/English company map that scores companies on five axes and offers optional in-browser Ikigai matching that connects a visitor's own LLM access to surface grounded company matches.

## The free core

The whole app works with no model connected: the company map, filters, favorites, company detail pages, axis info pages, and the philosophy page are static or browser-local and require no inference. Only the **Ikigai matching flow** is model-powered, and it is opt-in — reached from a map chrome control and gated on a confirmed BYOK configuration only when a run actually needs the LLM. Inference is never a wall in front of the product.

## Model-powered features and their categories

| Feature | Category needed | Why |
|---|---|---|
| Ikigai — ISCO derivation | worker | structured JSON extraction: map answers to allowed ISCO minor codes |
| Ikigai — pass 1 (top ~25) | worker | ranking/classification over ~100 compact profiles into ~25 ids |
| Ikigai — pass 2 (3–10 matches) | worker | data-grounded reasoning over ~25 fuller profiles; structured synthesis over supplied data, not deep world-knowledge — worker suffices per `01`'s definition |

**Category choice surface:** the BYOK setup sheet (`src/components/ByokSetupDialog.tsx`) surfaces the worker-tagged models from the provider registry (`src/lib/byok/providers.ts`) as a `<select>`; the visitor picks within the feature's declared category. Each model in the registry is tagged `frontier` or `worker`; the stored config carries the visitor's choice per category (`modelByCategory`). The request boundary (`src/lib/byok/client.ts`) resolves the model from the request's declared category and refuses (`missing_config`) when the visitor has not chosen a model for that category.

## How to get and connect a key, for this app

- Reached from the map's Ikigai chrome control; starting a run with no confirmed config opens the BYOK setup sheet (`src/components/ByokSetupDialog.tsx`).
- Provider: OpenRouter (v1-only). The visitor picks a model within the feature's declared category (worker), pastes an API key, optionally saves it on this device, and sets an optional local USD allowance.
- **Current deviation (change F):** the setup sheet does not yet walk a first-time key holder through what a key is, where to get an OpenRouter key, or setting a provider-side spend limit. It is a key/allowance form today.

## Key handling specifics

- **In-memory by default.** The pasted key lives in a module-level session variable (`sessionApiKey` in `src/lib/byok/storage.ts`); it is written to `localStorage` only when the visitor explicitly opts into "save on this device" (`saveKey`).
- **Saved-key reuse.** On a later visit, the sheet shows a key is saved and asks the visitor to confirm reuse without ever displaying the raw key. The public config never contains the raw key.
- **Stale key cleared on auth failure.** When the provider returns an auth failure (`invalid_key`, 401/403), `src/lib/byok/client.ts` calls `clearByokKey()` before returning: the in-memory `sessionApiKey` and the persisted `savedKey` are wiped and `BYOK_CHANGED_EVENT` is emitted. The Ikigai flow surfaces the localized invalid-key state and routes retry through the BYOK request gate, which re-opens the setup sheet in the enter-key state (saved-key reuse gone) because no key remains. No silent retry — exactly one fetch per attempt.
- **Direct browser to provider.** `src/lib/byok/openrouter.ts` POSTs to `https://openrouter.ai/api/v1/chat/completions` with the visitor's key; there is no developer backend or proxy in the path.
- **No analytics or telemetry.** No third-party endpoint receives the key or prompts; inference data goes to OpenRouter only. The error path leaks nothing either — `clearByokKey` and the error mapping write no key or prompt content to any log, store, or report.
- **CSP posture.** A strict Content-Security-Policy is emitted as a `<meta http-equiv="content-security-policy">` tag in every built page via Astro `experimental.csp` (`astro.config.mjs`), host-agnostic. `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`. Inline scripts are hash-locked (Astro computes SHA-256 digests for bundled inline scripts; one app-authored `<script is:inline>` — the pre-paint `skip-map-reveal` check — is allowlisted by its stable hash in `scriptDirective.hashes`); there is no `'unsafe-inline'` or `'unsafe-eval'` in `script-src`. `connect-src` is a closed allowlist: `'self'`, `https://openrouter.ai`, `https://api.mapbox.com`, `https://*.mapbox.com` — no wildcard `*`. Concessions for Mapbox GL, recorded and justified: `worker-src 'self' blob:` (Mapbox spawns WebGL workers from blob URLs) and `style-src 'self' <hashes>` plus Mapbox runtime style injection (Mapbox sets CSSOM properties — ungoverned by CSP — and injects `<style>` elements). Neither concession opens a key-exfiltration channel: the operative protections live in `script-src` (no injected-script exfil) and the closed `connect-src` (no arbitrary-origin egress). A meta-tag CSP cannot set `frame-ancestors`/`report-uri`/`sandbox`; for this app's threat model (stop key/prompt exfil via injected scripts) the head-meta placement is early enough and `script-src`/`connect-src` are the load-bearing directives.
- **Third-party JS audit (inv 4).** After `script-src 'self'`, nothing loads from a CDN at runtime; every dependency is bundled by Vite. Runtime surface: `mapbox-gl` (the map IS the product — the largest attack surface in a key-holding app, kept because removing it removes the product; bounded by the closed `connect-src` and `script-src 'self'`), `react`/`react-dom` (UI shell, bundled), `supercluster` (map clustering, pure JS, bundled), the Astro island runtime (minimal hydration), and Tailwind (build-time CSS, no runtime JS). The honest tension — Mapbox GL is the biggest supply-chain-XSS vector and it is also the product — is stated plainly; the CSP `script-src 'self'` + hashed-inline posture means a compromised Mapbox bundle still cannot inject a script that exfiltrates the key to an arbitrary origin (the closed `connect-src` blocks it).

## Where spend and budget appear in the UI

- The visitor sets an optional local USD allowance in the setup sheet (`byok-allowance-input`).
- Cumulative usage is derived as the sum of a **local spend history** (`src/lib/byok/history.ts`) — one record per completed request, stored on-device next to the key (same browser-local posture as the key, invariant 1). Each record carries the request `purpose`, the cost in the provider's billing unit (USD), the cost source (`provider` or `unknown`), optional token counts, and a timestamp; it never carries prompt or response content (invariant 5 / data-egress). No count cap is applied (realistic volume is tiny).
- The OpenRouter adapter (`src/lib/byok/openrouter.ts`) **streams** (`stream: true` + `stream_options.include_usage`); provider usage arrives as a discrete event in the final chunk, so the boundary surfaces an honest pending → landed transition per request rather than an opaque fetch. A stream that omits usage synthesizes an `unknown`-cost record rather than fabricating a number (per `06`'s honest boundary).
- **Live per-pass cost** is shown in the Ikigai `deriving`/`judging` loading states via a typed cost-event bus (`src/lib/byok/cost.ts`): the boundary emits `pending` when a request starts and `landed` (real cost, 4 decimals) when usage arrives, attributed by `purpose` (`ikigai-isco-derivation` / `pass-1` / `pass-2`). Cost is never shown as an estimate; the pre-flight estimate (change D) is guard-only.
- The setup sheet surfaces the cumulative spend, the allowance progress when set, and the recent on-device spend records (`#byok-spend`), updating live as requests land.
- **No-lost-work leave warning** (`src/lib/byok/leaveGuard.ts`): a single `beforeunload` listener fires when an in-flight paid request is running (an in-flight-request count, not a dollars signal, so a future zero-estimate model still guards) OR a consuming feature has flagged unsaved work (`setByokUnsavedWork`).

## What happens when the budget ceiling is hit

- A visitor who has not set an allowance (`null`) has no ceiling; requests are never refused on budget grounds.
- Before any fetch, `src/lib/byok/budget.ts` estimates the request's token cost (input ≈ message characters / 4, output ≈ `maxTokens ?? 2048`), priced via the active model's per-token rates or a conservative fallback rate when pricing is unknown. If the derived cumulative usage (`readByokUsageUsd()`, the sum of local spend history) plus in-flight reservations plus this estimate would exceed `allowanceUsd`, the request is refused with `allowance_exceeded` before the provider is called.
- In-flight estimates are reserved before the fetch and released on both success and failure, so concurrent or multi-step calls cannot blow past the ceiling before spend catches up, and a failed request does not permanently consume budget.
- The estimate is a best-effort guard only and is never shown as the cost of a request; displayed cost comes from provider-reported real usage, surfaced via the cost-event bus (see above). The provider-side spend limit (the hard cap) is not yet prompted during onboarding (change F).

## How each security invariant is met

| # | Invariant | Status | Where |
|---|---|---|---|
| 1 | In-memory by default, opt-in persistence | met | `src/lib/byok/storage.ts` — `sessionApiKey`; `saveKey` opt-in |
| 2 | Key never sent to dev servers | met | `src/lib/byok/openrouter.ts` — direct browser to OpenRouter; no dev backend |
| 3 | Strict CSP | met | `astro.config.mjs` — `experimental.csp` emits a hash-locked `<meta>` CSP; closed `connect-src`; no `'unsafe-inline'`/`'unsafe-eval'` in `script-src` (concessions: Mapbox `blob:` workers + style injection, justified above) |
| 4 | Minimal third-party JS | met | all runtime deps bundled by Vite (no CDN loads); audited and justified in "Key handling specifics" — Mapbox is the largest surface and the product, bounded by `script-src 'self'` + closed `connect-src` |
| 5 | Never log key / key-linked prompts | met | no logging paths; prompts not persisted; `clearByokKey` and the 401 error path write no key/prompt content anywhere (tested) |
| 6 | Pre-flight estimation + enforceable budget | met | `src/lib/byok/budget.ts` — pre-flight token estimate + in-flight-aware cumulative ceiling (`derived usage + inFlight + estimate > allowance` refuses pre-fetch); cumulative usage derived from the local spend history (`src/lib/byok/history.ts`) |

Data egress (key and prompts go only to the provider): met — no analytics or telemetry.

## Deviations

A burn-down list: long now, shrinking as changes B–F close each gap. The BYOK layer predates the BYOM constitution; the constitution is being adopted after the fact via `BYOM_INTEGRATION_PLAN.md`.

- **Onboarding incomplete (`03`, change F).** The setup sheet is a key/allowance form; it does not explain what a key is, link to OpenRouter, or prompt setting a provider spend limit.
- **Terminology: BYOK vs BYOM.** The app's layer is key-centric ("BYOK"); the constitution is model-centric ("BYOM"). They refer to the same integration. Logged as friction in `BYOM_STRUGGLES.md`.
- **No badge or registry listing yet.** Adopted is not compliant; the badge lands only at full compliance (change G).

## The pinned constitution version

- **Constitution:** BYOM
- **Pinned version:** `v0.1.0`
- **Pinned commit:** `e2fc406678cfc48ec967af511e6761407a4120cc`
- **Submodule path:** `vendor/byom` (branch `release/v0.1`, tag `v0.1.0`)

## Propagation log

App-specific extension — `vendor/byom/constitution/05-integration-guide.md` prescribes no such section (see `BYOM_STRUGGLES.md`).

- `none -> v0.1.0` (2026-06-24): initial adoption. Submodule added at `vendor/byom`, pinned to tag `v0.1.0` (commit `e2fc406`). Authored this `BYOM-INTEGRATION.md` by following `05`; recorded current deviations; opened `BYOM_STRUGGLES.md` for Phase 5 friction.
- `v0.1.0` (2026-06-24): change D (`byok-preflight-budget`) closed invariant 6. Added `src/lib/byok/budget.ts` (pre-flight token estimate + in-flight-aware cumulative ceiling + reserve/release); wired reserve/release around the adapter call in `client.ts`. Resolved the inv-6 deviation; see `BYOM_STRUGGLES.md` for the estimation/heuristic, null-pricing, and in-flight-acceptance-signal friction surfaced during this change.
- `v0.1.0` (2026-06-24): change C (`byok-model-categories`) closed the hardcoded-model deviation. Replaced the single pinned model with a category model: each model in `providers.ts` is tagged `frontier`/`worker`; `ByokStoredConfig` carries `modelByCategory` (per-category visitor choice, migrate-on-read from legacy `modelId`); `ByokRequest` carries a `category` declaration; the boundary resolves the model by category and refuses unconfigured categories; the Ikigai runner declares `worker` for all three passes; the setup sheet exposes a `<select>` chooser. Confirmed pass-2 as `worker` (data-grounded synthesis, not world-knowledge). See `BYOM_STRUGGLES.md` for the "surface suitable options" acceptance-bar friction.
- `v0.1.0` (2026-06-24): change B (`byok-security-csp-and-stale-key`) closed invariants 3, 4, 5 and the stale-key deviation. Added a strict, host-agnostic CSP via Astro `experimental.csp` (meta tag, hash-locked `script-src`, closed `connect-src`, Mapbox `blob:`/style concessions justified); added `clearByokKey()` in `storage.ts` and wired it in `client.ts` on `invalid_key` (wipes session + persisted key, emits change event, no retry); the Ikigai flow routes retry through the BYOK gate to re-open setup in the enter-key state; the BYOK setup sheet subscribes to `BYOK_CHANGED_EVENT`. Audited the runtime JS surface. Resolved the inv 3/4/5 and stale-key deviations; see `BYOM_STRUGGLES.md` for the "strict CSP" acceptance-signal and inv 4 "minimal"-threshold friction surfaced during this change.
- `v0.1.0` (2026-06-25): change E (`byok-cost-transparency`) closed `06-cost-transparency.md` (all four principles). Switched the OpenRouter adapter to streaming SSE (`stream: true` + `stream_options.include_usage`) exposed as an `AsyncIterable<ByokStreamEvent>`, so provider usage arrives as a discrete final-chunk event; the boundary (`client.ts`) still returns `Promise<ByokResult>` (runner contract unchanged) while emitting `pending`/`landed` cost events to a typed bus (`src/lib/byok/cost.ts`). Replaced the cumulative `usageUsd`/`usageCostSource` config fields with a persisted **local spend history** (`src/lib/byok/history.ts`) — the single source of truth for cumulative usage, derived as `Σ` records; no count cap (realistic volume is tiny). Surface live per-pass cost (pending → real, 4 decimals, attributed by `purpose`) in the Ikigai loading states; cumulative spend + recent records in the setup sheet. Added a leave warning (`src/lib/byok/leaveGuard.ts`) firing on an in-flight paid request (request-count, not dollars) OR feature-flagged unsaved work. Resolved the `06` deviation; see `BYOM_STRUGGLES.md` for the "pending mid-stream assumes streaming" and "leave-warning acceptance signal" friction surfaced during this change.
