## Why

The map already helps visitors browse companies, but it does not yet turn a visitor's own work, strengths, and preferences into a focused set of companies worth considering. The BYOK prerequisite is now in place, so the next step is a browser-local Ikigai matching flow that can use an LLM without adding accounts or a backend.

## What Changes

- Add an Ikigai matching flow launched from the existing map Ikigai button after BYOK access is confirmed.
- Ask a small set of simple questions about what the visitor does, what they are good at, what they care about, and what kind of work context they prefer.
- Map the strengths/work answers to strong and weak ISCO-08 minor-code candidates using the reusable BYOK LLM request boundary.
- Deterministically prefilter and rank companies that share those ISCO tags, combining user-tag confidence with company tag prominence and confidence.
- Let the visitor tighten only the existing five axis focus filters when the deterministic candidate pool is too large, targeting a top pool of about 100 companies before LLM judging.
- Run two LLM matching passes: a first pass over compact company descriptions to choose about 25 candidates, then a second pass over fuller company profiles to choose 3-10 grounded matches with reasoning.
- Support refinement prompts such as "more in this direction" by rerunning the matching passes against the same deterministic top pool.
- Persist the visitor's Ikigai answers, filters, run history, LLM outputs, and selected results locally in the browser.
- Do not persist API keys, prompts, or responses in BYOK storage; Ikigai owns only its own feature history.
- No pipeline data-contract change in this slice; fuller LLM profiles are composed from the existing validated company fields.

## Capabilities

### New Capabilities
- `ikigai-matching`: browser-local Ikigai questionnaire, ISCO-tag derivation, deterministic candidate ranking, LLM matching passes, refinements, and local run history.

### Modified Capabilities
- `map-overview`: the existing Ikigai chrome button starts the matching flow when a BYOK configuration is confirmed, while still opening BYOK setup when it is not.

## Impact

- Affects `src/components/MapView.tsx` and new Ikigai UI components for the flow and results.
- Adds a new `src/lib/ikigai/` capability for types, deterministic ranking, prompt construction, parsing, orchestration, and local storage.
- Uses the existing `src/lib/byok/` request boundary for all provider calls.
- Uses existing `src/lib/company-data/` accessors and company fields; no backend, account system, analytics, cookies, or pipeline contract changes.
- Adds focused unit tests for ranking, prompt parsing, storage normalization, and orchestration error handling, plus browser tests for map entry and the flow's main states.
