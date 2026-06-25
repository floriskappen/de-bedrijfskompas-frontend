## Context

The BYOK layer (`src/lib/byok/`) enforces a visitor-set USD allowance, but only *after* the provider responds: `client.ts` checks `isByokAllowanceExhausted(config)` against accumulated `usageUsd` before the fetch, and `updateByokUsage(realCost)` runs after. Two concurrent calls each read `usageUsd=0`, both pass, both fetch — spend overshoots the ceiling before any real cost lands. BYOM invariant 6 (`vendor/byom/constitution/02-security-invariants.md`) explicitly requires a pre-flight estimate and in-flight-aware accounting to close this. The Ikigai runner (`src/lib/ikigai/runner.ts`) issues sequential `await`ed passes today, so the gap is latent; this change protects future concurrent callers and satisfies the constitution. Only one model exists (`deepseek/deepseek-v4-flash`) with **null pricing** in `providers.ts`; Change C later introduces categories with real per-model pricing.

## Goals / Non-Goals

**Goals:**
- Refuse an over-budget request *before* `fetch`, accounting for requests already in flight, so `usageUsd + inFlightUsd + estimateUsd > allowanceUsd` ⇒ `allowance_exceeded` with no fetch.
- Estimate token cost pre-flight without adding a tokenizer dependency (preserves BYOM invariant 4 — minimal third-party JS).
- Keep provider-reported real usage as the sole source of truth for `usageUsd` and for any displayed cost (Change E owns the display surface).
- Resolve the invariant-6 deviation in `BYOM-INTEGRATION.md`; log constitution friction to `BYOM_STRUGGLES.md`.

**Non-Goals:**
- Surfacing cost to the user (live cost, history, pending state, leave warning — Change E).
- Model categories / per-model pricing / user model choice (Change C).
- CSP, stale-key clearing, third-party-JS audit (Change B).
- Any UI change; the refusal already surfaces as `allowance_exceeded` through the existing Ikigai flow.

## Decisions

### Dedicated budget module (`src/lib/byok/budget.ts`)

In-flight reservation is ephemeral runtime state, distinct from the persisted config in `storage.ts`. A new `budget.ts` owns estimation, the in-flight counter, and the ceiling check; `storage.ts` stays the persistence layer; `client.ts` orchestrates (estimate → reserve → send → release/commit). Alternatives: (a) put `inFlightUsd` in `storage.ts` — blurs persistence with transient state and complicates the test-reset surface; (b) keep it local to `client.ts` — works but scatters the guard logic. The dedicated module gives a single testable seam and matches the constitution's framing of the ceiling as a distinct concern.

### Estimation heuristic — characters/4 input, `maxTokens ?? 2048` output, no tokenizer

Input tokens ≈ `sum(message.content length) / 4` (the common rough ratio for latin-script text). Output tokens ≈ `request.maxTokens ?? 2048` (the adapter's effective default when `maxTokens` is undefined). No tokenizer library is pulled in — that would add attack surface against invariant 4, and the constitution blesses no heuristic. The method is recorded here and in `BYOM-INTEGRATION.md` as best-effort, per "The honest budget boundary." Alternatives: a real tokenizer (rejected — dependency/inv 4); tokens from a prior identical request (no history yet, cold-start).

### Fallback USD rate when model pricing is null (conservative, guard-only)

The current model has `inputUsdPerMillionTokens: null`. When pricing is null, estimation falls back to a **conservative** per-token USD rate (a named constant in `budget.ts`, sized to over-estimate slightly against known cheap-flash pricing so the guard never under-blocks). The fallback is used **only** for the ceiling guard; it never becomes displayed cost (`06` owns display from real provider usage). When Change C supplies real pricing, the fallback is no longer hit. Alternatives: (a) populate DeepSeek pricing now — bleeds into C's scope and rework; (b) skip the pre-flight block when pricing is null — doesn't satisfy inv 6 and under-guards. The conservative fallback keeps invariant 6 honest in the pre-C world.

### Reserve before fetch, release on both success and failure

`client.ts` reserves `estimateUsd` into `inFlightUsd` before calling the adapter, and releases it in a `finally`-style path on both success and failure (network error, invalid key, etc.) so a failed request does not permanently consume budget. On success, `updateByokUsage(realCost)` then advances `usageUsd` from the provider's real number. The transient where the reservation and (later) real usage briefly co-exist over-counts — the safe direction for a guard. Releasing on failure prevents a burst of errors from locking out the session.

### `null` allowance = no ceiling; checks skipped

A visitor who never sets `allowanceUsd` (`null`) has no ceiling — pre-flight estimation and the in-flight check are skipped entirely, matching today's behaviour and inv 6's "user-set" framing (unset ⇒ unenforced). This keeps the free/optional posture: inference is never blocked for a user who chose not to budget.

### No UI change; unit-only verification

D emits the existing `allowance_exceeded` error code through the same path the Ikigai flow already handles. No visual constraint changes, so the OpenSpec UI rule (real browser checks for visual constraints) is satisfied by the absence of a visual change. Verification is unit tests against `budget.ts` and `client.ts` (pre-flight blocks before fetch; concurrent in-flight overshoot refused; reserve/release symmetry; null-allowance skip). Stated explicitly so the verifier doesn't expect a Playwright step.

## Risks / Trade-offs

- **Estimate overshoots and blocks a legitimate request** → conservative fallback can refuse a request that would have fit. Mitigation: the fallback is sized against cheap-flash pricing and is temporary (Change C brings real pricing); the provider-side spend limit remains the hard cap, so the app ceiling refusing early is the safe failure mode.
- **`maxTokens ?? 2048` over-estimates when the model returns short output** → the guard reserves for a full 2048-token response even if the real output is 50 tokens. Mitigation: reservation is released on completion and replaced by real usage; over-reservation is transient and conservative.
- **In-flight state is module-local, lost on page reload** → a reload mid-flight drops the reservation; a concurrent request after reload could overshoot. Mitigation: the provider-side spend limit is the hard cap; the app ceiling is a session guard (per `02`). Reloading aborts in-flight requests anyway (Change E's leave warning covers that surface).
- **Concurrent callers must share one in-flight counter** → any future caller that bypasses `sendByokLlmRequest` (calling the adapter directly) would not be accounted for. Mitigation: the adapter is not exported broadly; `client.ts` is the single entry point and is the only caller today.
