## 1. Constitution read path

- [x] 1.1 Read `vendor/byom/AGENTS.md`, then `vendor/byom/constitution/02-security-invariants.md`, then `01-provider-model.md` and seam 2 of `05-integration-guide.md` before editing.

## 2. Types and provider registry

- [x] 2.1 Add `ByokModelCategory = "frontier" | "worker"` to `src/lib/byok/types.ts`.
- [x] 2.2 Add `category: ByokModelCategory` to `ByokModelConfig`; add `category: ByokModelCategory` to `ByokRequest`; replace `modelId: string` on `ByokStoredConfig` with `modelByCategory: Partial<Record<ByokModelCategory, string>>`; replace `modelId` on `ByokSetupInput` with `modelByCategory: Partial<Record<ByokModelCategory, string>>`; add `category: ByokModelCategory` to `ByokProviderRequest` (the adapter receives the resolved model id; the category is carried for completeness).
- [x] 2.3 In `src/lib/byok/providers.ts`, tag the existing model with `category: "worker"`, restructure `BYOK_PROVIDERS.openrouter` so `models` is a flat list of category-tagged models, and add `getByokModelsForCategory(providerId, category): ByokModelConfig[]`. Drop `defaultModelId` in favour of a per-category default resolved from the first model of each category. Keep the dated "verified against OpenRouter" note on each model entry.

## 3. Storage migration and config shape

- [x] 3.1 In `src/lib/byok/storage.ts`, replace `normalizeModelId` with `normalizeModelByCategory`: accept a legacy `modelId` string and migrate it into `modelByCategory.worker` when valid; default an unset `worker` category to the first worker model in the provider registry. Unknown categories are dropped.
- [x] 3.2 Update `getDefaultByokConfig` to return `modelByCategory: { worker: <first worker model id> }` instead of `modelId`.
- [x] 3.3 Update `confirmByokSetup` to accept `modelByCategory` and store it; update `confirmSavedByokKey` to preserve the existing `modelByCategory`.
- [x] 3.4 Update `toPublicConfig` and `writeStoredPayload` to carry `modelByCategory` instead of `modelId`.

## 4. Request boundary routing

- [x] 4.1 In `src/lib/byok/client.ts`, resolve `request.category` → `config.modelByCategory[request.category]`. If unset, return `{ ok: false, error: "missing_config" }` before fetching. Pass the resolved `modelId` and `category` into the adapter call. Keep the existing allowance-exhausted check before the category resolution.

## 5. Ikigai runner category declarations

- [x] 5.1 In `src/lib/ikigai/runner.ts`, add `category: "worker"` to the three `sendRequest` call sites (ISCO derivation `purpose: "ikigai-isco-derivation"`, pass-1 `purpose: "ikigai-pass-1"`, pass-2 `purpose: "ikigai-pass-2"`). Update the `IkigaiLlmSender` type usage so injected test senders receive the `category` field.

## 6. Setup UI model chooser

- [x] 6.1 In `src/components/ByokSetupDialog.tsx`, replace the read-only model `<input>` with a `<select id="byok-model">` listing the worker-tagged models from `getByokModelsForCategory`, mirroring the existing provider `<select>` and `.byok-field` pattern. The selected value seeds from `config.modelByCategory.worker`.
- [x] 6.2 Update `confirmByokSetup` call in the dialog to pass `modelByCategory: { worker: <chosen model id> }` instead of `modelId`.
- [x] 6.3 Add the model chooser to the saved-key reuse path so a returning visitor can change their worker model without re-entering the key (ties to the C/F split: chooser primitive only, not the full management surface).

## 7. Tests — unit

- [x] 7.1 Update existing `src/lib/byok/client.test.ts` tests to supply `category: "worker"` on every `sendByokLlmRequest` call and `modelByCategory: { worker: "deepseek/deepseek-v4-flash" }` on every `confirmByokSetup` call, keeping the suite green.
- [x] 7.2 Add test `boundary routes by declared category` covering the "Boundary routes by declared category" scenario: a request with `category: "worker"` is dispatched with the visitor's chosen worker model id in the fetch body.
- [x] 7.3 Add test `unconfigured category is refused before the provider call` covering the "Unconfigured category is refused before the provider call" scenario: a request declaring a category with no chosen model returns `missing_config` and `fetch` is not called.
- [x] 7.4 Add test `legacy saved model migrates to the worker category` covering the "Legacy saved model migrates to the worker category" scenario: writing a legacy `{ modelId: "deepseek/deepseek-v4-flash" }` payload then reading config yields `modelByCategory.worker` equal to that id and a working session.
- [x] 7.5 Add tests in `src/lib/ikigai/ikigai.test.ts` (or the runner test home) for `ISCO derivation declares worker`, `Pass 1 declares worker`, and `Pass 2 declares worker`: a capturing fake sender asserts each call's `category` is `"worker"`.
- [x] 7.6 Add a test asserting no hardcoded single model remains: the provider registry contains more than one model OR the boundary resolves exclusively via `modelByCategory` (guard against a regression to a pinned `defaultModelId` path).

## 8. Tests — browser (Playwright)

- [x] 8.1 Add a Playwright test `visitor chooses within a category` covering the "Visitor chooses within a category" scenario: open the BYOK setup sheet, assert the model chooser is a real `<select>` (not a read-only input) listing the worker models, pick one, and confirm. Run alongside the existing BYOK Playwright checks.

## 9. BYOM-INTEGRATION.md and friction logging

- [x] 9.1 In `BYOM-INTEGRATION.md`, resolve the hardcoded-model deviation (remove it from the burn-down list), and make the pass-2 category non-tentative (`worker`, confirmed). Fill the model-powered-features-and-categories table with the decided categories and the reasoning (structured extraction / ranking / data-grounded synthesis — not deep world-knowledge).
- [x] 9.2 Append a `BYOM_STRUGGLES.md` entry for the `01` "surface suitable options" acceptance-bar gap (the constitution gives no minimum for how many models constitutes real choice) if that friction was hit — or state explicitly in the change verification notes that no new constitution friction arose and why.

## 10. Verification

- [x] 10.1 Run `npm run typecheck` (or the repo's typecheck command) and fix any type errors from the `ByokStoredConfig` / `ByokRequest` shape change across `byok/*`, `ikigai/runner.ts`, and `ByokSetupDialog.tsx`.
- [x] 10.2 Run the BYOK and Ikigai unit tests (`vitest`) and the Playwright suite; confirm all named tests pass.
- [x] 10.3 Run `openspec status --change byok-model-categories` and confirm it reports ready to archive.
