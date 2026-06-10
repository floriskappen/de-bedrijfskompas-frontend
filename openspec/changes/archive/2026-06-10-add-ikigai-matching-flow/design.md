## Context

The app is static and browser-local: company data is loaded at build time, user-specific state stays in localStorage/session memory, and LLM access already exists through the BYOK request boundary. The current map Ikigai button only opens BYOK setup. The company data contract exposes three-digit ISCO capability tags, tag prominence/confidence, localized taglines, five axis scores, and localized per-axis reasoning; it does not expose a separate full summary field.

## Goals / Non-Goals

**Goals:**
- Add a modular Ikigai matching capability that can run entirely in the browser.
- Keep provider/key mechanics inside BYOK while Ikigai owns prompts, parsing, ranking, and history.
- Spend LLM calls only after deterministic filtering has reduced the candidate set.
- Persist enough local history for a visitor to revisit and refine runs without accounts or a backend.
- Reuse existing axis filter semantics and company data fields.

**Non-Goals:**
- Add a backend, account system, analytics, cookies, or shared server-side matching history.
- Change the pipeline-emitted company data contract in this slice.
- Build provider-specific cost estimation beyond the existing BYOK allowance tracking.
- Guarantee perfect occupational classification; the flow returns explainable candidates, not career advice.

## Decisions

**Create `src/lib/ikigai/` as the feature boundary.** It should contain types, question definitions, deterministic ranking, prompt builders, response parsers, orchestration, and local storage. Alternative: keep the logic inside the React component. That would be faster initially, but it would make ranking and prompt handling hard to test and would blur ownership with BYOK.

**Use BYOK only as the LLM transport.** Ikigai calls `sendByokLlmRequest(...)` with a purpose, messages, and response format, then parses the returned content itself. Alternative: extend BYOK with Ikigai-specific helpers. That would leak feature semantics into a generic provider layer and contradict the archived BYOK spec.

**Constrain ISCO derivation to the loaded company dataset.** The ISCO-mapping prompt should include the minor codes currently present in renderable company tags, their labels/domain hints, and counts. Alternative: let the model choose any valid ISCO-08 minor code. That is theoretically broader, but it often produces locally useless codes that cannot match any company.

**Rank before prompting.** Deterministic ranking should score shared minor codes from both sides: strong user tags weigh more than weak ones; company `core` tags weigh more than `supporting`, then `incidental`; low-confidence company tags are discounted. Alternative: feed all companies to the LLM. That does not scale once the scraper expands the dataset and makes cost/latency less predictable.

**Compose compact and full profiles from current fields.** Pass 1 should use company id, name, localized tagline, tags, and axis levels. Pass 2 should add the localized per-axis reasoning and numeric/evidence metadata. Alternative: add a `summary` field to the data contract now. That may become useful later, but it is not needed to ship the browser flow.

**Store run records by stable ids and structured outputs.** Local history should store answers, derived tags, axis filters, candidate ids, selected result ids, LLM reasoning, timestamps, and refinement text. It should not denormalize full company snapshots, because names, scores, and taglines should come from current static company data.

**Model the UI as a single resumable flow.** The map opens a sheet/dialog after BYOK is confirmed. The flow can move through questions, tag review, candidate tightening, running states, results, and history. Alternative: make separate routes. A sheet keeps context on the map and matches the existing map chrome pattern.

## Risks / Trade-offs

- [Risk] LLM returns malformed JSON or irrelevant ISCO codes. -> Use strict parsers, reject unknown codes, surface a localized error, and allow retry without losing answers.
- [Risk] Small datasets produce fewer than 25 or 100 candidates. -> Treat target counts as ceilings; run with the available matching pool and explain empty/low-result states.
- [Risk] LLM reasoning may hallucinate beyond company data. -> Prompts must instruct grounding in supplied fields, and parsers/results should keep references to company ids and provided evidence.
- [Risk] LocalStorage can become stale or oversized. -> Store versioned run records, cap retained runs, and derive company display fields from current data.
- [Risk] BYOK allowance or provider failures interrupt a run mid-flow. -> Keep the draft/run state locally and show recovery actions: reopen BYOK, retry, or continue editing answers.
- [Risk] Axis tightening could feel like hidden filtering. -> Present it as explicit preference tightening, not a relevance score, and keep tags fixed while axes change.
