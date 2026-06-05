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
- [ ] One explanation page per axis, describing what it means.
- [ ] Linked from detail page icons and from the filters.

## Philosophy / about page
- [ ] General page explaining the site's philosophy and what we're trying to achieve.
- [ ] Link out to the per-axis info pages.
- [ ] Surface it as a button on the map (core for new users) and in other sensible spots.

## Filters page
- [ ] Move away from each axis in a separate card.
- [ ] Each axis as a header row with a question-mark icon linking to its info page.
- [ ] Improve the sliders.
- [ ] Add a filter for favorites.

## Favorites (local, in-browser only — no accounts/backend)
- [ ] Save/remove favorites, persisted in the browser.
- [ ] Filter on favorites in the filters page.
- [ ] Dedicated favorites page with a list overview.

## Ikigai matching (in-browser LLM, bring-your-own-key)
The flow:
- [ ] Ask the user questions to understand what they do and care about.
- [ ] Map the "what they're good at" answers into minor ISCO tags, with strong/weak confidence candidates.
- [ ] Filter companies down to those sharing the user's ISCO tags.
- [ ] Sort by combined strength of user tags + company tags; take the top ~100.
- [ ] UI step: show result count; let the user browse the list and see axes.
- [ ] Let the user tighten axis filters (not tags) until results are <= 100.
- [ ] LLM pass 1: feed the ~100 no-bullshit descriptions + user ikigai input → pick top ~25.
- [ ] LLM pass 2: feed the full summaries of those ~25 → pick 3–10 strong matches with detailed, summary-grounded reasoning.
- [ ] Results UI: show the 3–10 picks; let the user expand to see the other ~25 candidates.
- [ ] Iteration: user can refine ("more in this direction…") → rerun passes 1 & 2 on the top 100.
- [ ] Persist the whole thing locally: conversation history, filters set, and results per run.

## Data — scraper service (new, third service before the pipeline)
- [ ] Build a scraper service that collects company names (+ optional websites) from various sources.
- [ ] Primary approach: exploit job-board providers (e.g. Google `workable` + role terms) to find companies with active vacancies.
- [ ] Also pull from other company lists.
- [ ] Goal: a large set of companies (e.g. Utrecht) to feed into the pipeline; current DB only has ~15.


# General
- [ ] For the axes, switch focus from numbers to 3 levels (e.g., "goed", "normaal", "weinig" - the names should indicate how good/bad they are at it, but how much focus is given on this subject. makes it more intuitive to filter on it. for example if i dont care about verankering, i want to include companies that are >=weinig. i would never want to include companies tht are "bad" at verankering.) which correspond to certain number ranges. Also nicer to filter. And say this on the detail page also in the dropdowns

## Notes
- Pipeline service: good shape.
- Frontend: see items above.
- Everything user-specific (favorites, ikigai history, API key) stays local in the browser.
- Ikigai may change once tested for real — these are ideas, not final.
