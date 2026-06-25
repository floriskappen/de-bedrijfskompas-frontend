## Context

The BYOK layer enforces a visitor-set USD allowance but spend is invisible: the setup sheet shows a "cost indication comes later" placeholder, there is no per-request cost, no spend history, no pending state while a request is in flight, and closing the page mid-request aborts a paid call silently. The OpenRouter adapter (`byok/openrouter.ts`) is a single non-streaming `fetch` whose `usage` arrives only with the final response, so there is no signal path between `reserveByokEstimate` and `updateByokUsage` — the React layer just `await`s a black box. Change D added the pre-flight/in-flight ceiling (`budget.ts`); this change (E) closes BYOM `06-cost-transparency.md` (all four principles) on top of that foundation.

## Goals / Non-Goals

**Goals:**
- Switch the adapter to streaming so provider usage arrives as a discrete event, giving the boundary a place to emit honest pending → landed cost.
- Make cumulative usage a derived sum of a persisted local spend history (one source of truth).
- Surface live per-pass cost in the Ikigai flow and a spend/history view in the setup sheet.
- Add a leave warning that fires during an in-flight paid request or unsaved feature work.

**Non-Goals:**
- Token-level UI streaming (the transport streams; the UI consumes cost events, not tokens — Ikigai passes return JSON, not streamed text).
- Provider-side spend-limit prompt, full onboarding wizard (Change F).
- CSP, stale-key clearing, third-party-JS audit (Change B, done).
- Model categories / per-model pricing (Change C, done).
- Storage migration (not deployed to real users).

## Decisions

### Streaming adapter as an `AsyncIterable`; boundary aggregates to `Promise<ByokResult>`

`openrouter.ts` POSTs with `stream: true` + `stream_options.include_usage` and yields `ByokStreamEvent` (text deltas, then a usage event) via an async generator, parsing SSE from the streaming `Response.body`. `client.ts` consumes the iterable, accumulates content, and still returns `Promise<ByokResult>`. Why streaming: provider usage arrives at the final chunk, making `06`'s "pending, mid-stream" framing literally true and dissolving a `BYOM_STRUGGLES` entry; it also supplies the event spine cost transparency needs. Why keep the `Promise` return: the Ikigai runner wants full content and its `IkigaiLlmSender` injection seam stays intact. Alternatives: non-streaming + bolt-on callbacks (no event spine, friction remains); change the runner to consume a stream (couples the runner to transport; Ikigai returns JSON, not streamed text).

### Typed cost-event bus (`byok/cost.ts`) over window events or stream passthrough

The boundary emits `{ requestId, purpose, phase: "pending"|"landed", costUsd?, costSource? }` to a typed `subscribeByokCost(listener)` pub/sub as it reserves/lands. Why a dedicated typed bus: per-request events are higher-frequency than the rare `BYOK_CHANGED_EVENT`, and a typed channel is testable without stubbing `window`. Why not pass the stream to the UI: the UI needs pending → landed per `purpose`, not tokens; the bus carries exactly that and keeps the runner simple. Alternative: reuse `window.dispatchEvent` (stringly-typed, less testable).

### Local spend history as the single source of truth for cumulative usage (replace `usageUsd`)

`byok/history.ts` persists `{ id, purpose, costUsd, costSource, tokens?, timestamp }` records (no prompt/response content — invariant 5). `readByokUsageUsd()` is the derived `Σ` of records; `storage.ts` drops the `usageUsd`/`usageCostSource` fields. Why replace: one source, no drift between a scalar and a record list. Why no count cap: realistic volume is tiny (hundreds × ~100 B ≈ tens of KB against a ~5 MB quota); capping would truncate cumulative spend. The budget ceiling reads the derived sum. Alternative: scalar alongside history (two sources, drift risk).

### Module split: `cost.ts` + `history.ts` + `leaveGuard.ts` + an in-flight-request count in `budget.ts`

Each new module is single-responsibility and mirrors the existing `budget.ts` (ephemeral) / `storage.ts` (persisted) precedent: `cost.ts` (ephemeral event bus), `history.ts` (persisted records + derived usage), `leaveGuard.ts` (one `beforeunload` listener). `budget.ts` gains an in-flight *request* count. Why a request count rather than reusing `readByokInFlightUsd()`: the leave-warning semantic is "a call in progress," not "$ reserved" — a free/future zero-estimate model would still be a paid request worth warning about; the count is the honest signal. Alternative: one combined transparency module (mixes ephemeral bus + persisted records + DOM listener).

### Leave guard = in-flight count OR feature unsaved-work flag; constitution guard is automatic

`leaveGuard.ts` warns when the in-flight-request count > 0 (constitution `06` p4 — byok-owned, automatic via boundary inc/dec) OR a consuming feature has called `setByokUnsavedWork(true)` (feature-owned unsaved-result state). One `beforeunload` listener toggled on 0↔1 transitions. Why automatic for the constitution guard: it must be correct regardless of feature wiring. Why expose the feature flag: the user's added "unsaved query result" condition is feature state, not byok state. Alternative: feature-owned-only (the constitution guard would depend on every feature remembering to wire it).

### Two cost surfaces: live in the flow (bus), history in the sheet (persisted)

The Ikigai `deriving`/`judging` states show per-pass pending → `$X` (4 decimals) driven by the bus (the `purpose` field maps to a label, giving pass-level attribution without a runner-contract change). The setup sheet replaces the placeholder with total spent, allowance progress, and the recent spend list. Why two surfaces: they have different lifecycles (`06` p1 live vs p3 history). Alternative: run-level pending only (coarser, less honest about per-pass cost).

## Risks / Trade-offs

- **SSE parse edge cases** (chunks split across reads, in-stream errors, usage chunk location) → robust line-buffered parse over `ReadableStream` + `TextDecoder`; in-stream failures map to `network_error`/`malformed_response`; tests cover a partial-chunk split and usage-in-the-final-chunk.
- **Stream abort leaves pending state stuck** → boundary `finally` releases the estimate and emits a terminal event on every path (success/error/abort); the UI clears pending on terminal.
- **Provider omits usage in the stream** → the record lands with `costSource: "unknown"` and the UI shows "unknown"/pending rather than fabricating a number (per `06`'s honest boundary).
- **`beforeunload` is not assertable in Playwright/jsdom** → unit-test the guard predicate (`isByokLeaveGuarded()`); the in-flight path is covered via `page.route`, but the unload dialog itself has no observable acceptance signal — log as `BYOM_STRUGGLES` friction.
- **Test rewrite for streaming `fetch`** → existing `client.test.ts` mocks return a single JSON `Response`; they move to a streaming `Response` whose `body` is a `ReadableStream` of SSE. Acceptable (not deployed).
