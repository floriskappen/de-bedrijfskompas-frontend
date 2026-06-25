## 1. Budget module

- [x] 1.1 Create `src/lib/byok/budget.ts` exporting the estimation function: input tokens ≈ `sum(message.content length) / 4`, output tokens ≈ `request.maxTokens ?? 2048`; convert to USD via the active model's pricing from `providers.ts`, falling back to a named conservative `FALLBACK_USD_PER_TOKEN` constant when pricing is null. The estimate is returned as a single `estimateUsd` number.
- [x] 1.2 Add the in-flight reservation API to `budget.ts`: module-level `inFlightUsd` with `reserveByokEstimate(estimateUsd)`, `releaseByokEstimate(estimateUsd)`, and `readByokInFlightUsd()`; plus `resetByokBudgetForTests()` mirroring `storage.ts`'s test-reset pattern.
- [x] 1.3 Add the pre-flight ceiling check to `budget.ts`: `isByokRequestWithinBudget(config, estimateUsd)` returning false (refuse) when `config.allowanceUsd !== null && config.usageUsd + inFlightUsd + estimateUsd > allowanceUsd`; returns true (skip/allow) when `allowanceUsd === null`.

## 2. Wire the request boundary

- [x] 2.1 In `src/lib/byok/client.ts`, before the adapter call: compute `estimateUsd`, then run `isByokRequestWithinBudget`; if it fails, return `{ ok: false, error: "allowance_exceeded" }` with no fetch (replacing the current sole `isByokAllowanceExhausted` post-hoc check, which stays as the fast path for already-exhausted usage).
- [x] 2.2 Reserve `estimateUsd` via `reserveByokEstimate` before calling the adapter; release it via `releaseByokEstimate` on both success and failure (wrap the adapter call so network/error/invalid-key paths release too), then on success call the existing `updateByokUsage(realCost)`.

## 3. Tests (`src/lib/byok/client.test.ts` and/or a new `budget.test.ts`)

- [x] 3.1 `byok allowance blocks exhausted requests` — keep the existing test green (post-hoc exhausted usage still refuses with `allowance_exceeded`, no fetch).
- [x] 3.2 `byok pre-flight estimate blocks over-budget request before fetch` — set `allowanceUsd` so accumulated usage is below it but `usage + estimate` exceeds it; assert `allowance_exceeded` and `fetch` not called.
- [x] 3.3 `byok concurrent in-flight requests cannot overshoot ceiling` — issue two `sendByokLlmRequest` calls concurrently (not awaited sequentially), each estimate alone fitting but combined exceeding; assert the second resolves `allowance_exceeded` and `fetch` is called exactly once.
- [x] 3.4 `byok failed request releases in-flight reservation` — make the adapter return an error (e.g. 401 → `invalid_key`); assert `readByokInFlightUsd()` returns to the pre-request value so a subsequent request is not falsely blocked by the dead reservation.
- [x] 3.5 `byok unset allowance skips ceiling check` — `allowanceUsd: null` with a large estimate still sends (fetch called) and does not refuse on budget grounds.
- [x] 3.6 `byok provider usage updates local state` — keep the existing test green (real provider cost still advances `usageUsd`).

## 4. Constitution conformance records

- [x] 4.1 Update `BYOM-INTEGRATION.md`: mark the invariant-6 deviation resolved; update the "How each security invariant is met" table row 6 to point at `src/lib/byok/budget.ts`; update "What happens when the budget ceiling is hit" to describe pre-flight + in-flight; record the estimation method and the conservative-fallback-rate boundary in the deviations note.
- [x] 4.2 Append friction entries to `BYOM_STRUGGLES.md` for each constitution-level issue hit: estimation-required-but-no-blessed-heuristic-and-tokenizer-discouraged (inv 4 vs inv 6); null-pricing / pre-category case the constitution is silent on; in-flight accounting stated with no observable acceptance signal. If no new friction arises, state so explicitly in the change's verification notes with the reason.

## 5. Verify

- [x] 5.1 Run `npm run typecheck` (or the project's typecheck command) and the BYOK unit tests; all green.
- [x] 5.2 Run `openspec status --change byok-preflight-budget` and confirm apply-ready; run the `byom-consumption` spec test to confirm the pin/invariant mapping still holds.
