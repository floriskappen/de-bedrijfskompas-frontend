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
| Ikigai — pass 2 (3–10 matches) | worker (tentative) | data-grounded reasoning over ~25 fuller profiles; default to worker unless reasoning quality demands frontier — to be confirmed in change C |

**Current deviation (change C):** the layer hardcodes a single model (`deepseek/deepseek-v4-flash`) and does not yet expose frontier/worker categories or let the user choose within a category. The table records the *intended* categories; the choice UI is not yet built.

## How to get and connect a key, for this app

- Reached from the map's Ikigai chrome control; starting a run with no confirmed config opens the BYOK setup sheet (`src/components/ByokSetupDialog.tsx`).
- Provider: OpenRouter (v1-only). The visitor pastes an API key, optionally saves it on this device, and sets an optional local USD allowance.
- **Current deviation (change F):** the setup sheet does not yet walk a first-time key holder through what a key is, where to get an OpenRouter key, or setting a provider-side spend limit. It is a key/allowance form today.

## Key handling specifics

- **In-memory by default.** The pasted key lives in a module-level session variable (`sessionApiKey` in `src/lib/byok/storage.ts`); it is written to `localStorage` only when the visitor explicitly opts into "save on this device" (`saveKey`).
- **Saved-key reuse.** On a later visit, the sheet shows a key is saved and asks the visitor to confirm reuse without ever displaying the raw key. The public config never contains the raw key.
- **Direct browser to provider.** `src/lib/byok/openrouter.ts` POSTs to `https://openrouter.ai/api/v1/chat/completions` with the visitor's key; there is no developer backend or proxy in the path.
- **No analytics or telemetry.** No third-party endpoint receives the key or prompts; inference data goes to OpenRouter only.
- **CSP posture:** not yet in place — see Deviations (inv 3, change B).
- **Third-party JS:** Mapbox GL, React, Tailwind, Astro. Audit and justification pending (change B).

## Where spend and budget appear in the UI

- The visitor sets an optional local USD allowance in the setup sheet (`byok-allowance-input`).
- Usage is tracked from provider-reported cost (`usage.cost`) and accumulated in `usageUsd`; cost source is `provider` when reported, else `unknown` (never fabricated).
- **Current deviation (change E):** a "cost indication follows later" placeholder is shown; there is no live per-request cost UI, no local spend-history view, and no pending state mid-stream. Pre-flight estimation does not yet exist (change D).

## What happens when the budget ceiling is hit

- `isByokAllowanceExhausted` refuses a new request before it is sent, returning an `allowance_exceeded` error surfaced in the localized setup/flow UI. No silent failure.
- **Current deviation (change D):** the check is post-hoc on cumulative usage; there is no pre-flight token estimate and no in-flight accounting, so concurrent or multi-step calls could exceed the ceiling before spend catches up. The provider-side spend limit (the hard cap) is not yet prompted during onboarding (change F).

## How each security invariant is met

| # | Invariant | Status | Where |
|---|---|---|---|
| 1 | In-memory by default, opt-in persistence | met | `src/lib/byok/storage.ts` — `sessionApiKey`; `saveKey` opt-in |
| 2 | Key never sent to dev servers | met | `src/lib/byok/openrouter.ts` — direct browser to OpenRouter; no dev backend |
| 3 | Strict CSP | unmet | no CSP in the app today (change B) |
| 4 | Minimal third-party JS | partial | Mapbox/React/Tailwind present; audit and justification pending (change B) |
| 5 | Never log key / key-linked prompts | met | no logging paths; prompts not persisted (tested) |
| 6 | Pre-flight estimation + enforceable budget | partial | allowance ceiling + post-hoc usage exists; no pre-flight estimate, no in-flight accounting (change D) |

Data egress (key and prompts go only to the provider): met — no analytics or telemetry.

## Deviations

A burn-down list: long now, shrinking as changes B–F close each gap. The BYOK layer predates the BYOM constitution; the constitution is being adopted after the fact via `BYOM_INTEGRATION_PLAN.md`.

- **CSP missing (inv 3, change B).** No Content-Security-Policy is in place.
- **No stale-key clearing on 401 (`03`, change B).** An `invalid_key` result is returned and shown, but the in-memory key is not cleared and no re-connect prompt forces it.
- **Hardcoded model, no category choice (`01`, change C).** `src/lib/byok/providers.ts` pins `deepseek/deepseek-v4-flash`; no frontier/worker concept; the user cannot choose within a category.
- **No pre-flight token estimation (inv 6, change D).** Allowance is enforced post-hoc; concurrent or multi-step calls are not in-flight-aware.
- **Onboarding incomplete (`03`, change F).** The setup sheet is a key/allowance form; it does not explain what a key is, link to OpenRouter, or prompt setting a provider spend limit.
- **Cost transparency partial (`06`, change E).** Placeholder cost only; no live per-request cost, no spend history, no pending state, no leave-warning before aborting a paid request.
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
