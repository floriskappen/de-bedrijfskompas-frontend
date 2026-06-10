## 1. Ikigai Core Types And Questions

- [x] 1.1 Create `src/lib/ikigai/` with exported types for questionnaire answers, ISCO candidates, deterministic candidates, LLM pass outputs, run records, flow errors, and storage payloads.
- [x] 1.2 Add fixed localized question definitions and validation for required answers.
- [x] 1.3 Add unit tests `ikigai requires completed questionnaire before matching` covering `Visitor completes questionnaire` and `Incomplete answers prevent matching`.

## 2. ISCO Derivation And Deterministic Ranking

- [x] 2.1 Build helpers that collect allowed ISCO minor codes from renderable companies with counts, labels, and domain hints for the ISCO mapping prompt.
- [x] 2.2 Add prompt builders and strict parsers for ISCO derivation output with `strong` and `weak` candidates.
- [x] 2.3 Reject parsed ISCO codes that are not present in the loaded company dataset before ranking.
- [x] 2.4 Implement deterministic company filtering and ranking from derived ISCO candidates, company tag prominence, and company tag confidence.
- [x] 2.5 Add unit tests `ikigai parses allowed isco candidates`, `ikigai rejects unknown isco candidates`, and `ikigai recovers from malformed isco response`.
- [x] 2.6 Add unit tests `ikigai ranks shared isco companies`, `ikigai excludes non-overlapping companies`, and `ikigai ranks strong core matches ahead`.

## 3. Axis Tightening And Prompt Profiles

- [x] 3.1 Add Ikigai-specific axis filter state using the existing focus minimum semantics and candidate count calculation.
- [x] 3.2 Ensure axis tightening never mutates the derived ISCO candidates.
- [x] 3.3 Build compact pass-1 company profiles from current company id, name, localized tagline, tags, and axis levels.
- [x] 3.4 Build fuller pass-2 company profiles from current company fields, localized tagline, numeric/evidence axis data, and localized per-axis reasons.
- [x] 3.5 Add unit tests `ikigai large pool can be tightened`, `ikigai axis tightening preserves tags`, and `ikigai small pool proceeds without tightening`.

## 4. LLM Runner And Error Handling

- [x] 4.1 Implement an Ikigai runner that calls `sendByokLlmRequest(...)` for ISCO derivation, pass 1, pass 2, and refinement runs without storing anything in BYOK.
- [x] 4.2 Add strict parsers for pass 1 candidate ids and pass 2 selected matches, ignoring ids outside the supplied candidate sets.
- [x] 4.3 Preserve draft answers and current flow state when BYOK returns missing-config, allowance, provider, network, or rate-limit errors.
- [x] 4.4 Add empty deterministic pool handling that lets the visitor revise answers or rerun ISCO derivation.
- [x] 4.5 Add unit tests `ikigai pass 1 returns valid candidate ids`, `ikigai pass 2 returns grounded matches`, and `ikigai ignores invalid company ids`.
- [x] 4.6 Add unit tests `ikigai provider error preserves draft`, `ikigai empty deterministic pool is shown`, `ikigai missing byok blocks prompts`, and `ikigai confirmed byok starts flow`.

## 5. Local History Storage

- [x] 5.1 Implement versioned localStorage helpers for Ikigai run history with a retention cap and normalization for malformed stored payloads.
- [x] 5.2 Persist questionnaire answers, derived ISCO candidates, axis filters, deterministic candidate ids, LLM candidate ids, selected result ids, reasoning, refinements, timestamps, and schema version.
- [x] 5.3 Ensure storage never stores API keys or full denormalized company snapshots.
- [x] 5.4 Resolve saved run company ids against current static company data and hide missing companies without breaking the run.
- [x] 5.5 Add unit tests `ikigai run persists locally`, `ikigai display uses current company data`, `ikigai missing saved companies are hidden`, and `ikigai storage omits secrets and snapshots`.

## 6. Flow UI And Map Entry

- [x] 6.1 Read `vendor/ontwerp/AGENTS.md` and the relevant ontwerp language, recipe, zoo, and values files before UI edits; record adaptations in `.design/DESIGN.md`.
- [x] 6.2 Add localized UI messages and labels for the Ikigai questionnaire, running states, axis tightening, results, broader candidates, refinements, history, and errors.
- [x] 6.3 Build an `IkigaiFlowDialog` or equivalent map sheet that shows questionnaire, tag/candidate review, axis tightening, running states, results, broader candidates, refinement input, and saved history.
- [x] 6.4 Update `MapView` so the Ikigai button opens BYOK setup without confirmed BYOK and opens the matching flow with confirmed BYOK.
- [x] 6.5 Render result cards from current company data with identity, localized tagline, axis focus summary, stored Ikigai reasoning, and links to detail pages.
- [x] 6.6 Add Playwright tests `map ikigai button opens byok setup without config`, `map ikigai button opens matching flow with config`, `ikigai selected matches are shown first`, `ikigai broader candidates are available`, and `ikigai visitor refines completed run`.

## 7. Verification

- [x] 7.1 Run targeted Vitest suites for `src/lib/ikigai/` and affected BYOK/map tests.
- [x] 7.2 Run targeted Playwright tests for the map entry and Ikigai flow states.
- [x] 7.3 Run `npx astro check`.
- [x] 7.4 Run OpenSpec validation/status for `add-ikigai-matching-flow` and confirm the change is apply-ready.

## 8. Flow Sequencing Fix

- [x] 8.1 Split Ikigai execution into explicit ISCO/candidate preparation and LLM judging stages.
- [x] 8.2 Update the UI so users derive ISCO tags first, review/filter the deterministic candidate pool second, and only then run LLM pass 1/pass 2.
- [x] 8.3 Add or update tests proving LLM judging is not run before the candidate-review stage.

## 9. Flow UX Rework (premium wizard)

- [x] 9.1 Rewrite the four direction questions to be richer and grounded in the ikigai circles (eyebrow/helper/examples), keeping the existing question ids and ISCO/axis pipeline.
- [x] 9.2 Split the flow into a run-selection bottom sheet (drag handle, history list, resume card, new run) and a full-screen stepped wizard for a single run.
- [x] 9.3 Present the questionnaire one question per step with a progress rail and back/next, and make refinement its own wizard step.
- [x] 9.4 Adopt the ontwerp `state.loading.germinating` seed head for the derive and judge waits (with a reduced-motion rest state); record the design adaptation in `.design/DESIGN.md`.
- [x] 9.5 Persist a resumable in-progress draft (answers, step, axis minimums, derived ISCO) to localStorage, with resume/discard from the menu; clear it once a run is saved.
- [x] 9.6 Move BYOK gating off the map button and into the start/resume/refine actions via a continuation callback; ensure the BYOK sheet stacks above the full-screen wizard.
- [x] 9.7 Update the Playwright flow tests for the stepped wizard and confirm `astro check`, Vitest, and the map/ikigai Playwright suite pass.
