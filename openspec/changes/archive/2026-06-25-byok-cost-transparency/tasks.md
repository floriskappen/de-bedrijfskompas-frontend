## 1. Streaming adapter

- [x] 1.1 In `src/lib/byok/types.ts`, define `ByokStreamEvent` (`{ type: "text"; delta: string } | { type: "usage"; usage: ByokUsage }`) and change `ByokProviderAdapter.send` to return `AsyncIterable<ByokStreamEvent>` (an async generator). Drop `usageCostSource: "estimated"` from `ByokCostSource` (records are `provider` | `unknown` only; the pre-flight estimate is guard-only and never a cost source).
- [x] 1.2 Rewrite `src/lib/byok/openrouter.ts` to POST with `stream: true` + `stream_options: { include_usage: true }`, parse SSE from `response.body` (`ReadableStream` + `TextDecoder`) with a line buffer that survives chunks split across reads, yield `text` deltas per `choices[0].delta.content`, yield a final `usage` event from the usage-bearing chunk, and throw a typed error (carrying a `ByokErrorCode`) for 401/403/402/429 and malformed/in-stream failures (reusing the existing HTTP/error-text mapping).
- [x] 1.3 Add `tests` (vitest) for the adapter: `openrouter streams text deltas then usage` (assert text deltas accumulate and a usage event arrives with `costSource: "provider"`); `openrouter survives a chunk split mid-`data:` line`; `openrouter maps 401 to invalid_key` (thrown); `openrouter maps a stream without usage to unknown cost`.

## 2. Cost-event bus, history, leave guard modules

- [x] 2.1 Create `src/lib/byok/cost.ts`: a typed pub/sub exposing `subscribeByokCost(listener)`, `emitByokCostPending({ requestId, purpose })`, `emitByokCostLanded({ requestId, purpose, costUsd, costSource, tokens? })`, and `emitByokCostEnded({ requestId, purpose })` (terminal, clears pending). Module-local listener set (no `window` dependency). Include `resetByokCostForTests()`.
- [x] 2.2 Create `src/lib/byok/history.ts`: persisted spend records under a new localStorage key (e.g. `de-bedrijfskompas:byok-spend:v1`), shape `{ id; purpose; costUsd: number | null; costSource: "provider" | "unknown"; promptTokens?; completionTokens?; totalTokens?; timestamp }`. Expose `readByokSpendHistory()`, `appendByokSpendRecord(record)`, `clearByokSpendHistory()`, `readByokUsageUsd()` (derived `Σ` of `costUsd ?? 0`), `resetByokHistoryForTests()`. Emit `BYOK_SPEND_CHANGED_EVENT` on append/clear. No prompt/response content is ever stored.
- [x] 2.3 Create `src/lib/byok/leaveGuard.ts`: an in-flight-request count (`incByokInFlightRequest`/`decByokInFlightRequest`, mirrored in `budget.ts` or here) plus a feature unsaved-work flag (`setByokUnsavedWork(active)`); `isByokLeaveGuarded()` returns `inFlightRequests > 0 || unsavedWork`. Manage a single `beforeunload` listener added on 0→1 transitions and removed on 1→0. Expose `resetByokLeaveGuardForTests()`.
- [x] 2.4 Add unit tests: `cost bus delivers pending then landed to subscribers`; `history appends records and derives cumulative usage`; `history never stores prompt or response content`; `leave guard predicate is guarded during in-flight or unsaved work` (scenario: Leave warning fires).

## 3. Boundary wiring

- [x] 3.1 In `src/lib/byok/client.ts`, consume the adapter's `AsyncIterable` inside `sendByokLlmRequest`: reserve the estimate (unchanged), `incByokInFlightRequest()` + `emitByokCostPending()` before iterating, accumulate `text` deltas, on the `usage` event call `appendByokSpendRecord(...)` + `emitByokCostLanded(...)`, and `return { ok: true, content, usage }`. Keep the `Promise<ByokResult>` signature (runner untouched).
- [x] 3.2 On a thrown adapter error: map to `{ ok: false, error }`, `clearByokKey()` when `invalid_key` (unchanged), then `emitByokCostEnded()`. In a `finally`: `releaseByokEstimate()` + `decByokInFlightRequest()` + `emitByokCostEnded()` if not already emitted — every terminal path (success/error/abort) releases and clears pending.
- [x] 3.3 Route the budget ceiling (`isByokAllowanceExhausted`, `isByokRequestWithinBudget`) to read `readByokUsageUsd()` (derived from history) instead of the removed `config.usageUsd` field.
- [x] 3.4 In `src/lib/byok/budget.ts`, add the in-flight-request count API used by `leaveGuard` (or co-locate it here alongside `inFlightUsd`), with `resetByokBudgetForTests()` also resetting it.

## 4. Storage shape change

- [x] 4.1 In `src/lib/byok/storage.ts` + `types.ts`, remove `usageUsd` and `usageCostSource` from `ByokStoredConfig`; `normalizeStoredConfig` ignores legacy values (no migration — not deployed). `getDefaultByokConfig` no longer carries them. `updateByokUsage` is removed (history owns usage now). `readByokConfig` returns config without usage fields.
- [x] 4.2 Update `ByokSetupDialog.tsx`'s allowance-reached read (`config.usageUsd >= config.allowanceUsd`) and any other `usageUsd`/`usageCostSource` consumers to use `readByokUsageUsd()`.

## 5. Setup sheet spend + history surface

- [x] 5.1 In `src/components/ByokSetupDialog.tsx`, replace the `byok_cost_placeholder` block with a spend surface: cumulative spend (`readByokUsageUsd()`, 4 decimals, `$`), allowance progress bar/text when `allowanceUsd` is set, and a recent-spend list from `readByokSpendHistory()` (purpose label + cost + relative time). Subscribe to `BYOK_SPEND_CHANGED_EVENT` so it updates live. Follow ontwerp `byok-sheet`/`byok-field` patterns; introduce no new raw tokens. Lowercase copy; mono utility marks uppercase + tracking per convention.
- [x] 5.2 Add Playwright test `byok-cost-transparency.spec.ts` → `setup sheet shows cumulative spend and history` (scenario: Setup sheet shows cumulative spend and history): stub a completed BYOK request, open the sheet, assert the cumulative total, allowance progress, and a recent record appear in the active locale.

## 6. Ikigai flow live per-pass cost

- [x] 6.1 In `src/components/IkigaiFlowDialog.tsx`, subscribe to the cost bus (`subscribeByokCost`) while in the `deriving`/`judging` stages; show per-pass pending → real cost (`$X`, 4 decimals) attributed by `purpose` (map `ikigai-isco-derivation`/`ikigai-pass-1`/`ikigai-pass-2` to localized labels) inside the `GerminatingState` caption/sub area. Clear pending on `ended`.
- [x] 6.2 Add Playwright test `byok-cost-transparency.spec.ts` → `live cost shows pending then real usage`: stub a delayed streaming OpenRouter response via `page.route`, start an Ikigai run, assert the pending state shows during the in-flight request and the real cost shows when usage lands.

## 7. i18n

- [x] 7.1 In `src/lib/i18n/messages.ts`, add localized keys for: cost pending, cost landed (with amount), spend history label, per-pass labels (derive/pass-1/pass-2), and the leave-warning copy if surfaced. Remove/repurpose `byok_cost_placeholder`. Lowercase; nl + en blocks kept in sync.

## 8. Unit + browser tests (scenario coverage)

- [x] 8.1 Rewrite the existing `src/lib/byok/client.test.ts` `fetch` mocks from single-JSON `Response` to a streaming `Response` whose `body` is a `ReadableStream` of SSE. Keep these existing scenarios green (they are carried by the MODIFIED Local allowance tracking requirement): `byok allowance blocks exhausted requests`, `byok pre-flight estimate blocks over-budget request before fetch`, `byok concurrent in-flight requests cannot overshoot ceiling`, `byok failed request releases in-flight reservation`, `byok unset allowance skips ceiling check`.
- [x] 8.2 Update/replace `byok provider usage updates local state` → `byok provider usage appends a spend history record` (scenario: Provider usage updates local state): assert a history record with `purpose` and `costSource: "provider"` is appended and `readByokUsageUsd()` reflects it. Update the test that asserted `usageUsd`/`usageCostSource` on the config accordingly.
- [x] 8.3 Add `byok spend history is local and not transmitted` (scenario: Spend history is local and not transmitted): assert the record is in localStorage under the spend key and that no `fetch` call other than `https://openrouter.ai` occurs; assert the stored record and localStorage contain no prompt/response text.
- [x] 8.4 Add `byok spend attributed per feature` (scenario: Spend is attributed per feature): assert the appended record carries the request's declared `purpose`.
- [x] 8.5 Remove/replace any test asserting the old `byok_cost_placeholder` text or `usageUsd` config field.

## 9. Constitution conformance records

- [x] 9.1 Update `BYOM-INTEGRATION.md`: resolve all four `06-cost-transparency.md` deviations; update "Where spend and budget appear in the UI" and "How each security invariant is met" to point at `cost.ts`, `history.ts`, `leaveGuard.ts`; note streaming + history-as-source-of-truth + 4-decimal display; add a propagation-log entry for change E.
- [x] 9.2 Append friction entries to `BYOM_STRUGGLES.md` for constitution-level issues: the "pending mid-stream" framing assumes streaming (a non-streaming app must switch transports or reinterpret); the leave-warning `beforeunload` has no observable acceptance signal in browser test harnesses. If no further friction arises, state so explicitly with the reason.

## 10. Verify

- [x] 10.1 Run `npx astro check` (typecheck) and `npm test` (vitest); all green.
- [x] 10.2 Run `npm run test:e2e` (Playwright) for the new + existing byok/ikigai specs; all green.
- [x] 10.3 Run `openspec status --change byok-cost-transparency` and confirm apply-ready; run the `byom-consumption` spec test to confirm the pin/invariant mapping still holds.
