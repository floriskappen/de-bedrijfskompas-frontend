## Context

The BYOK layer (`src/lib/byok/`) predates the BYOM constitution. It pins one model (`deepseek/deepseek-v4-flash`) and shows it read-only in the setup sheet. The constitution (`01-provider-model.md`, seam 2 of `05`) requires a **category** model: features declare `frontier` / `worker`, the app surfaces suitable models, the visitor picks. Change A adopted the constitution and recorded the hardcoded-model gap; this change closes it. All three Ikigai LLM passes are currently the only model-powered features, and the single model in use is worker-class.

## Goals / Non-Goals

**Goals:**
- Make the BYOK layer category-aware end to end: provider registry, stored config, request boundary, runner call sites, and setup UI.
- Let the visitor choose a model within the feature's declared category — no silent hardcode.
- Record each model-powered feature's category with reasoning in `BYOM-INTEGRATION.md`.

**Non-Goals:**
- Live OpenRouter catalog fetch / fuzzy category classification — the registry stays curated and dated in `providers.ts`.
- The full persistent connection-management surface (clear-key, history view, budget-adjust-while-connected) — that is change F. C ships only the model chooser.
- A frontier feature or frontier models in the curated list — v1 is all-worker; the architecture is forward-compatible but no frontier picker is surfaced until models exist in the registry.
- Touching the pipeline↔frontend data contract.

## Decisions

### 1. Category-keyed stored config, not a single `modelId`

`ByokStoredConfig.modelId: string` becomes `modelByCategory: Partial<Record<ByokModelCategory, string>>`. The request boundary resolves `config.modelByCategory[request.category]`; an unset category returns `missing_config`. Alternatives considered: (a) single `modelId` with a category tag on the model and a mismatch error — simpler, but a future frontier feature would force the visitor to reconfigure and lose their worker choice, and requires another storage migration then; (b) per-request `modelId` passed by the caller — makes the boundary category-blind and pushes model resolution into every feature. Category-keyed is the faithful shape for "the user chooses per category" and is forward-compatible without a second migration.

### 2. Models tagged by category in the provider registry

`ByokModelConfig` gains `category: ByokModelCategory`. `BYOK_PROVIDERS.openrouter.models` is a flat list of tagged models; a helper `getByokModelsForCategory(providerId, category)` filters it. The setup UI surfaces a picker for each category that has models in the registry — since v1 ships only worker models, only the worker picker appears. This couples "categories surfaced" to "models curated," so adding a frontier model later automatically surfaces the frontier picker without a separate registry of needed categories. The curated list stays dated/reviewable (extending the existing "verified against OpenRouter on \<date\>" comment pattern to each model).

### 3. `category` on the request boundary, `purpose` retained

`ByokRequest` gains `category: ByokModelCategory`. The boundary resolves the model from the stored config by category before dispatch. `purpose: string` stays — it is the human/audit label and feeds change E's per-feature spend attribution; it carries no routing role. A `missing_config` result covers "no model picked for the requested category," reusing the existing error code rather than introducing a new one.

### 4. All three Ikigai passes declare `worker`

ISCO derivation, pass-1, and pass-2 each pass `category: "worker"`. Per `01`'s own definition, worker covers "classification, structured extraction, summarization, ranking, structured JSON output" — exactly what all three passes do. Pass-2 is data-grounded reasoning over *supplied* company profiles, not deep world-knowledge, so it does not meet `01`'s bar for frontier ("deep world knowledge or hard reasoning genuinely matters"). The constitution's default ("lean toward worker wherever it suffices") reinforces this. `BYOM-INTEGRATION.md`'s tentative `worker` for pass-2 is confirmed and made non-tentative.

### 5. Migrate-on-read, keep the storage key

The storage key stays `de-bedrijfskompas:byok-llm:v1`. `normalizeStoredConfig` migrates a legacy `modelId` into `modelByCategory.worker` (the old hardcoded model is worker-class, so this preserves the visitor's saved choice). Bumping the key would orphan saved keys for a schema change that is backward-compatible on read. A saved worker key is not disrupted.

### 6. Setup UI: a `<select>` mirroring the existing provider picker

The read-only `<input value={model.label} readOnly />` becomes a `<select>` of the category's models, reusing the existing `.byok-field` + `<label>` + `<select>` pattern the provider field already uses. This follows the ontwerp rule "invent from recipes and principles, not framework defaults" — the dialog already establishes the form-field pattern; the model chooser is the same pattern applied to a model list. No new component class introduced. The visitor picks within the worker category (the only one surfaced in v1).

## Risks / Trade-offs

- [Curated model list ages] → each entry carries a "verified on \<date\>" note; the maintainer advances the list deliberately, mirroring the existing pin-update process. The constitution's aging concern is answered by not pinning one model + a reviewable dated list, not by live fetching.
- [`01` gives no acceptance bar for "surface suitable options"] → a curated list of worker models is the app's interpretation; logged as friction in `BYOM_STRUGGLES.md` so BYOM v1 can prescribe a minimum.
- [Category-keyed storage is slightly more complex than v1 needs] → accepted; the forward-compatibility (no second migration when a frontier feature arrives) outweighs the small added shape. The setup UI only surfaces categories with models, so v1 complexity stays at one picker.
- [`BYOM-INTEGRATION.md` model-categories table drifts from runner declarations] → the runner's `category` literals and the doc table both cite the same three passes; a test asserts the runner declares `worker` for each, keeping them in lockstep.
