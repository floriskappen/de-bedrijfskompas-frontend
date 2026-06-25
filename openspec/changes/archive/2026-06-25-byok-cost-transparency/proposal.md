## Why

BYOK spend is invisible: the setup sheet shows a "cost indication comes later" placeholder, there is no per-request cost, no spend history, no pending state while a request is in flight, and closing the page mid-request aborts a paid call with no warning. This closes BYOM integration plan Change E and the `06-cost-transparency.md` deviation recorded in `BYOM-INTEGRATION.md`. The current adapter is a single non-streaming `fetch` whose usage arrives only with the final response, leaving no signal path between reserve and usage-update — switching to streaming gives the cost-event spine this change needs and makes `06`'s "pending, mid-stream" framing literally true rather than a friction entry.

## What Changes

- Switch the OpenRouter adapter (`byok/openrouter.ts`) to **streaming SSE** (`stream: true` + `stream_options.include_usage`), exposed as an `AsyncIterable<ByokStreamEvent>` of text deltas and a final real-usage event. The boundary aggregates the stream into the existing `Promise<ByokResult>` so the Ikigai runner's contract is unchanged.
- Add a **typed cost-event bus** (`byok/cost.ts`): the boundary emits per-request `pending` → `landed(costUsd, costSource)` events keyed by `purpose` as it consumes the stream, so subscribers see live cost without holding the stream.
- Replace the cumulative `usageUsd`/`usageCostSource` fields in `ByokStoredConfig` with a **persisted local spend history** (`byok/history.ts`): each record carries `{ purpose, costUsd, costSource, tokens, timestamp }` and **never** prompt/response content (invariant 5 / data-egress). `usageUsd` becomes a derived sum of history — one source of truth, no drift. No count cap (realistic volume is tiny).
- Surface **live per-pass cost** in the Ikigai `deriving`/`judging` loading states (pending → real `$X`, 4 decimals, attributed per `purpose`), driven by the bus.
- Surface a **spend summary + recent-history view** in `ByokSetupDialog`, replacing the placeholder — total spent, allowance progress, and the on-device spend list (same browser-local posture as the key).
- Add a **leave warning** (`byok/leaveGuard.ts`): a single `beforeunload` listener that fires when an in-flight paid request is running OR a consuming feature has flagged unsaved work, so leaving never silently aborts a paid request or loses an unsaved result.
- Update `BYOM-INTEGRATION.md`: resolve all four `06` deviations; log constitution friction (streaming-as-pending-assumption, history-vs-derived-usage) to `BYOM_STRUGGLES.md`.

## Capabilities

### New Capabilities
- _none_

### Modified Capabilities
- `bring-your-own-key-llm`: the cost-transparency surface — live per-request cost from real provider usage with a pending state, per-purpose attribution, a local spend history (the new source of truth for cumulative usage), and a leave warning during in-flight paid requests. The adapter moves to streaming; the stored config loses the `usageUsd`/`usageCostSource` fields (replaced by history).

## Impact

- **Code:** `src/lib/byok/` — `openrouter.ts` rewritten (streaming SSE, async iterable); `client.ts` orchestrates the stream + emits cost events + appends history; `storage.ts` loses `usageUsd`/`usageCostSource`; `budget.ts` gains an in-flight-request count; new `cost.ts` (event bus), `history.ts` (persisted records + derived `usageUsd`), `leaveGuard.ts` (`beforeunload`). `src/components/ByokSetupDialog.tsx` (spend/history view) and `src/components/IkigaiFlowDialog.tsx` (live per-pass cost) consume the bus. `src/lib/i18n/messages.ts` gains cost/history copy (lowercase convention).
- **BREAKING (storage shape):** `ByokStoredConfig` drops `usageUsd`/`usageCostSource`; spend now lives in a separate history record list. No migration needed (not deployed to real users).
- **Calling features:** `src/lib/ikigai/runner.ts` is **unchanged** at the API level — `sendByokLlmRequest` still returns `Promise<ByokResult>`; the runner aggregates internally. The `IkigaiLlmSender` injection seam is intact.
- **Dependencies:** none added (SSE parsed via the streaming `Response.body` `ReadableStream` + `TextDecoder`; no tokenizer/event-library dependency, preserving invariant 4).
- **Data contract with the pipeline:** untouched.
- **Constitution:** BYOM `06-cost-transparency.md` (all four principles) moves from deviation to met; `BYOM-INTEGRATION.md` updated. Constitution-level friction logged in `BYOM_STRUGGLES.md`.
- **Routes/UI:** the map route's Ikigai flow and BYOK setup sheet gain cost/history surfaces; no other route changes.
- **CSP:** unchanged — streaming uses the already-allowed `https://openrouter.ai` `connect-src` origin.
