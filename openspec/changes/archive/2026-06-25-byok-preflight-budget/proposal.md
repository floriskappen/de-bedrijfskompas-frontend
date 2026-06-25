## Why

The BYOK allowance ceiling is enforced *post-hoc*: a request is refused only after accumulated real usage (`usageUsd`) has already reached `allowanceUsd`. Two concurrent or rapidly-issued sequential calls each see stale `usageUsd` and both pass, so spend can overshoot the ceiling before provider-reported cost lands — exactly the gap BYOM invariant 6 ("accounting for in-flight requests, so concurrent or multi-step calls cannot blow past the ceiling") forbids. There is also no pre-flight token estimate, so the ceiling never acts as a guard rail *before* a fetch. This closes BYOM integration plan Change D and the invariant-6 deviation recorded in `BYOM-INTEGRATION.md`.

## What Changes

- Add **pre-flight token estimation** that approximates a request's input + output token cost from message content and `maxTokens`, converted to USD via model pricing. When model pricing is unknown (the current pre-categories world), use a documented conservative fallback rate so the guard never under-blocks. The estimate is used **only** to guard the ceiling; it is never the cost the user sees (cost-transparency, Change E, owns displayed cost from real provider usage).
- Add **in-flight-aware cumulative ceiling checking**: before any fetch, refuse the request with `allowance_exceeded` when `usageUsd + inFlightUsd + estimateUsd > allowanceUsd`, where `inFlightUsd` is the sum of estimates reserved for requests currently in flight.
- **Reserve** the estimate into in-flight state before the fetch and **release** it on both success and failure, so a failed/aborted request does not permanently consume budget.
- Keep the existing post-hoc provider-reported usage as the source of truth for `usageUsd` (unchanged). `null` allowance remains "no ceiling" — pre-flight checks are skipped.
- Introduce a dedicated budget module (`src/lib/byok/budget.ts`) that owns estimation, in-flight reservation, and the ceiling check, keeping ephemeral runtime state out of the persistence layer (`storage.ts`).
- No user-visible UI change: the refusal surfaces through the existing `allowance_exceeded` error path already handled by the Ikigai flow. Verification is unit-only (the OpenSpec UI rule is satisfied because no visual constraint changes).
- Update `BYOM-INTEGRATION.md`: resolve the invariant-6 deviation, point the invariant mapping at the new budget module, and record the best-effort boundary honestly.

## Capabilities

### New Capabilities

- _none_

### Modified Capabilities

- `bring-your-own-key-llm`: the "Local allowance tracking" requirement gains pre-flight estimation and in-flight-aware cumulative ceiling enforcement (refuse pre-fetch, account for concurrent requests); a new scenario covers concurrent in-flight overshoot.

## Impact

- **Code:** `src/lib/byok/` — new `budget.ts` (estimation + in-flight reservation + ceiling check), `client.ts` wired to reserve/estimate/release around the adapter call, `types.ts` may gain an estimate/in-flight shape. `storage.ts` unchanged apart from possible read helpers. `providers.ts` unchanged (Change C later supplies real per-model pricing; D uses a fallback rate when pricing is null).
- **Calling features:** `src/lib/ikigai/runner.ts` is unaffected at the API level — it already receives `allowance_exceeded` and aborts the pass. The runner is sequential today; the in-flight accounting protects future concurrent callers.
- **Dependencies:** none added (estimation is a character/token heuristic; no tokenizer dependency, preserving BYOM invariant 4 — minimal third-party JS).
- **Data contract with the pipeline:** untouched.
- **Constitution:** BYOM invariant 6 (`02-security-invariants.md`) and "The honest budget boundary" move from deviation to met; `BYOM-INTEGRATION.md` updated. Constitution-level friction encountered during this change is logged in `BYOM_STRUGGLES.md` (estimation-vs-minimal-JS, null-pricing case, in-flight acceptance signal — see design.md).
- **Routes/UI:** none.
