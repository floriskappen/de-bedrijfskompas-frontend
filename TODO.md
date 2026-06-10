# TODO — path to shipping

High-level checklist of what's left before the app feels complete. Each point is a known idea; details to be worked out when picked up. Order is roughly priority, not strict.

## Design / theme
- [ ] Rework theme colors — current palette isn't working.

## Detail page
- [x] Build a company detail page.
- [x] On the detail page, show the reasoning behind each axis rating.
- [x] Next to each axis explanation, add an icon linking to that axis's info page. (links resolve once the axis info pages ship)
- [x] Include a link to the company's website somewhere on the page.

## Axis info pages
- [x] One explanation page per axis, describing what it means.
- [x] Linked from detail page icons (carry `?from=` so back returns to the company). (filters link lands with the filters-page rework)

## Philosophy / about page
- [x] General page explaining the site's philosophy and what we're trying to achieve.
- [x] Link out to the per-axis info pages.
- [x] Surface it as a button on the map (core for new users); also linked from each axis page.

## Filters page
- [x] Move away from each axis in a separate card.
- [x] Each axis as a header row with a question-mark icon linking to its info page.
- [x] Improve the sliders. (now a 3-level focus strip: columns align with the bars, selected minimum reads as "at least … focus" via a focus meter)
- [x] Add a filter for favorites. (a switch at the top of the sheet)

## Favorites (local, in-browser only — no accounts/backend)
- [x] Save/remove favorites, persisted in the browser.
- [x] Filter on favorites in the filters page.
- [x] Dedicated favorites page with a list overview.

## Bring your own key (local LLM access prerequisite)
Separate change before Ikigai matching. Goal: one reusable browser-local LLM access layer that other flows can call without owning provider setup, key storage, allowance tracking, or provider error handling.

- [x] Add a new Ikigai/matching entry button to the map overview chrome; starting it opens the bring-your-own-key setup when no usable local LLM configuration is confirmed.
- [x] Build a provider setup UI with OpenRouter as the first supported provider.
- [x] Preselect the model intended for the matching flow (requested: DeepSeek V4 Flash; verify the exact OpenRouter model id during the change).
- [x] Let the user paste an API key for the selected provider.
- [x] Add an optional "save for next time" choice; saved keys stay only in browser-local storage and are never sent anywhere except the selected provider request.
- [x] On later visits, show the saved provider/model/key presence and ask the user to confirm using the saved key instead of exposing the full key.
- [x] Let the user set a local spending allowance for this flow/session.
- [x] Show a cost indication placeholder for now; later replace it with provider/model-aware estimates.
- [x] Create a reusable client/service boundary that accepts prompt requests from other components and returns structured LLM responses.
- [x] Track allowance usage locally from provider-reported usage/cost when available, with a conservative fallback when unavailable.
- [x] Handle provider failures clearly: invalid/expired key, insufficient credit, allowance exceeded, rate limits, network failure, malformed model response.
- [x] Persist only the provider config, saved-key choice, allowance state, and non-secret metadata locally; do not persist raw prompts/results here unless a calling feature explicitly owns that history.
- [x] Add focused tests for storage normalization, saved-key confirmation state, allowance accounting, and provider error mapping.

## Ikigai matching (in-browser LLM, uses bring-your-own-key)
The flow:
- [x] Ask the user questions to understand what they do and care about.
- [x] Map the "what they're good at" answers into minor ISCO tags, with strong/weak confidence candidates.
- [x] Filter companies down to those sharing the user's ISCO tags.
- [x] Sort by combined strength of user tags + company tags; take the top ~100.
- [x] UI step: show result count; let the user browse the list and see axes.
- [x] Let the user tighten axis filters (not tags) until results are <= 100.
- [x] LLM pass 1: feed the ~100 no-bullshit descriptions + user ikigai input → pick top ~25.
- [x] LLM pass 2: feed the full summaries of those ~25 → pick 3–10 strong matches with detailed, summary-grounded reasoning.
- [x] Results UI: show the 3–10 picks; let the user expand to see the other ~25 candidates.
- [x] Iteration: user can refine ("more in this direction…") → rerun passes 1 & 2 on the top 100.
- [x] Persist the whole thing locally: conversation history, filters set, and results per run.
- [x] Use the reusable bring-your-own-key LLM client for all prompt calls; the matching flow owns prompts, parsing, result history, and rerun state, but not API-key storage or provider request mechanics.

## Data — scraper service (new, third service before the pipeline)
- [ ] Build a scraper service that collects company names (+ optional websites) from various sources.
- [ ] Primary approach: exploit job-board providers (e.g. Google `workable` + role terms) to find companies with active vacancies.
- [ ] Also pull from other company lists.
- [ ] Goal: a large set of companies (e.g. Utrecht) to feed into the pipeline; current DB only has ~15.


# General
- [x] For the axes, switch focus from numbers to 3 levels — shipped as focus levels (weinig/gemiddelde/veel focus, + geen signaal), split at the pentagon's 33/66 rings. Filter slider and detail-page axis rows both use the level wording.

## Notes
- Pipeline service: good shape.
- Frontend: see items above.
- Everything user-specific (favorites, ikigai history, API key) stays local in the browser.
- Ikigai may change once tested for real — these are ideas, not final.
