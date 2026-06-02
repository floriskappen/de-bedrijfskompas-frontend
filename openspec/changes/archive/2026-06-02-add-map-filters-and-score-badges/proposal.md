## Why

The map currently shows uniform dots and an inert filters pill, so users cannot compare companies at a glance or narrow the visible set. The next map pass should expose the existing score data directly on pins and add mobile-first filtering without changing the full profile flow.

## What Changes

- Replace unclustered dot pins with compact composite-score badges.
- Compute composite scores from available numeric axis scores only; `null` axes do not count as zero.
- Remove the map chrome language switcher for now.
- Change the filters control into an icon-only button that opens a bottom-sheet filter panel.
- Add per-axis minimum score filters with distribution histograms, including a distinct unknown/no-signal bucket.
- Add tag filters with counts that update based on the current filter combination.
- Extend the company data contract with a validated `capability_tags` array using the agreed work-domain taxonomy and prominence values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-overview`: Map pins, chrome, and filtering behavior change on `/` and `/en/`.
- `company-data`: Company records gain validated taxonomy tags consumed by the filters UI.

## Impact

- Affects `src/components/MapPage.astro`, `src/components/MapView.tsx`, shared React filter UI, i18n messages, styles, and map overview E2E coverage.
- Affects `src/lib/company-data/types.ts`, `src/lib/company-data/index.ts`, and company-data tests.
- Touches the external pipeline/frontend data contract: the pipeline must emit `capability_tags: { family: TagId, prominence: "core" | "supporting" | "incidental" }[]`.
