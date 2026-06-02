## 1. Data Contract

- [x] 1.1 Add `TagId`, `TAG_IDS`, optional `tags`, and normalized tag access to `src/lib/company-data/types.ts`.
- [x] 1.2 Validate present tags in `src/lib/company-data/index.ts`, treat missing `tags` as `[]`, and reject unknown tag IDs with a build warning.
- [x] 1.3 Add unit tests named `missing tags behave as empty tags`, `known tags are preserved`, `unknown tags are rejected`, and `tags are locale-neutral`.

## 2. Score and Filter Model

- [x] 2.1 Add pure helpers for composite scores, axis minimum matching, tag AND matching, filtered company lists, histogram buckets, and facet counts.
- [x] 2.2 Cover helpers with unit tests named `composite score ignores unknown axes`, `all-null scores produce unknown score`, `axis minimum keeps unknowns at zero`, `axis minimum excludes unknowns above zero`, `tag filters combine with AND semantics`, `histogram includes unknown bucket`, `histogram buckets aggregate by tens`, and `counts update with other active filters`.

## 3. Map Markers and Filtering

- [x] 3.1 Replace unclustered marker dots with compact score/unknown badge markers in both Mapbox and fallback rendering paths.
- [x] 3.2 Apply the filtered company list to clustering, marker rendering, empty state, and rosette offsets.
- [x] 3.3 Clear selection and remove `selected` from the URL when active filters hide the selected company.
- [x] 3.4 Add Playwright tests named `every matching renderable company has one badge pin`, `null-score company is still tappable`, `collocated score badges fan out`, `selected score badge gets red halo ring`, `dynamic clustering counts matching companies`, `clicking filtered cluster zooms in`, and `filtering clears hidden selection`.

## 4. Filter Panel UI

- [x] 4.1 Replace the top-right filters pill with an icon-only filters button and remove the map chrome language switcher.
- [x] 4.2 Implement a mobile-first bottom-sheet filter panel with stepped open animation and reduced-motion fallback.
- [x] 4.3 Add axis slider controls with 5-point steps, unknown buckets, ten numeric histogram buckets, and reset behavior.
- [x] 4.4 Add tag chips with local inline SVG icons, counts, active state, and AND-selection behavior.
- [x] 4.5 Add Playwright tests named `icon-only filter button opens panel`, `reset clears active filters`, `reduced motion skips panel animation`, `histogram includes unknown bucket`, `histogram buckets aggregate by tens`, and `tag counts update with active filters`.

## 5. Regression Checks

- [x] 5.1 Update map chrome tests to assert the language switcher is absent from map chrome while `/` and `/en/` routes still render localized content.
- [x] 5.2 Run `openspec validate add-map-filters-and-score-badges --strict`.
- [x] 5.3 Run `npm run test`.
- [x] 5.4 Run the focused Playwright map overview tests.

## 6. Iteration Adjustments

- [x] 6.1 Increase rosette spacing for larger score badges.
- [x] 6.2 Add a score glyph to score badges so they read differently from cluster counts.
- [x] 6.3 Use stable histogram bar scaling so filtering cannot make buckets visually grow.
- [x] 6.4 Show active filter count on the filters icon.
- [x] 6.5 Hide zero-count tag chips when the current data has no tags and show an explicit no-tags state.
- [x] 6.6 Adapt tag parsing to pipeline `capability_tags` objects.
- [x] 6.7 Restore mobile-friendly sliders with tracks aligned to numeric histogram buckets.
- [x] 6.8 Localize axis and tag UI labels (nl/en) via `src/lib/i18n/labels.ts`; keep tag identifiers locale-neutral in data.
- [x] 6.9 Layer the open filter panel above the peek card and map markers by portaling it out of the map's stacking context.
- [x] 6.10 Keep the filter panel header (reset/close) pinned while the panel body scrolls.
- [x] 6.11 Add a `/test-no-tags` fixture page and restore explicit Playwright coverage of the empty tag section.
- [x] 6.12 Align the panel header reset and close controls to a shared height.
- [x] 6.13 Allow dragging the panel header down to dismiss the filter panel, mirroring the peek card gesture.
