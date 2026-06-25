## Why

The BYOK layer hardcodes a single model (`deepseek/deepseek-v4-flash`) and exposes it read-only in the setup sheet. The BYOM constitution (`01-provider-model.md`, seam 2 of `05`) requires the opposite: each model-powered feature declares a **category** (frontier / worker), the app surfaces suitable models for that category, and the visitor picks — never a silent hardcode. This change closes that gap (change C in `BYOM_INTEGRATION_PLAN.md`), making the layer category-aware and giving the visitor real model choice.

## What Changes

- Replace the single hardcoded model with a **category model**: each model in the provider registry is tagged `frontier` or `worker`, and the visitor's chosen model is stored **per category** (forward-compatible with a future frontier feature without reconfiguring).
- Add a `category` declaration to the BYOK request boundary; the boundary resolves the stored model for the requested category and refuses (`missing_config`) when the visitor has not picked a model in that category.
- Each Ikigai LLM pass declares its category. Decision (recorded in `design.md`): ISCO derivation, pass-1, and pass-2 are all **worker** — structured extraction / ranking / data-grounded synthesis over supplied profiles, not deep world-knowledge reasoning.
- Replace the read-only model input in `ByokSetupDialog.tsx` with a real model chooser (a `<select>` of the category's models, mirroring the existing provider `<select>`), surfacing the category the app's features need. Per the C/F split, C ships the chooser primitive; F later wires it into the full persistent connection surface.
- Resolve the hardcoded-model deviation in `BYOM-INTEGRATION.md` and fill the model-powered-features-and-categories table with the decided categories and reasoning.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `bring-your-own-key-llm`: the "Provider setup" requirement changes from "uses a configured default model" to category-aware model selection — models are tagged by category, the visitor chooses within the feature's declared category, and the request boundary routes by category. Adds a "Model category selection" requirement and a "visitor chooses within a category" scenario.
- `ikigai-matching`: each LLM pass (ISCO derivation, pass-1, pass-2) declares its model category (worker) through the BYOK request boundary.

## Impact

- **Code:** `src/lib/byok/` (`types.ts`, `providers.ts`, `storage.ts`, `client.ts`, `index.ts`) and `src/components/ByokSetupDialog.tsx`; `src/lib/ikigai/runner.ts` call sites gain a `category`. Tests in `src/lib/byok/client.test.ts` and `src/lib/ikigai/ikigai.test.ts` updated to supply `category`.
- **Storage shape:** `ByokStoredConfig.modelId: string` → `modelByCategory`. Migrate-on-read: a legacy `modelId` is treated as the `worker` pick (the old hardcoded model was worker-class), so saved-key visitors are not disrupted.
- **No data-contract impact:** the pipeline↔frontend company JSON is untouched. Inference stays browser → OpenRouter, no dev backend.
- **No new dependencies.** The model registry stays a curated, dated list in `providers.ts` (the maintainer curates it); no live OpenRouter catalog fetch in v1.
