## Why

Map filters currently reset whenever the map React island is recreated, so refreshing the overview or returning from a company detail page loses the visitor's browsing context. The app already keeps user-specific favorites, BYOK configuration, and Ikigai state in browser-local storage; map filter preferences should follow the same local-only model.

## What Changes

- Persist the map overview's axis minimums, selected work fields, and favorites-only toggle in versioned browser-local storage.
- Restore persisted filters on `/` and `/en/` before deriving visible companies and reconciling a `?selected=<company_id>` deep link.
- Make filter reset clear the persisted map-filter state while preserving the visitor's saved favorite companies.
- Normalize malformed, partial, duplicated, or obsolete stored values to supported filter values so the map remains usable as enums evolve.
- Add focused unit and browser coverage for reloads, detail-page round trips, locale changes, reset behavior, malformed storage, and selected-company reconciliation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-overview`: active map filters become browser-local preferences that survive map remounts, reloads, detail-page round trips, and locale changes.

## Impact

- Affects the `/` and `/en/` map routes and their shared `MapView` island.
- Adds a small capability-owned storage boundary for map filters, following the existing versioned and defensive local-storage patterns used by Ikigai, BYOK, and favorites.
- Updates map filter tests and Playwright coverage; no visual redesign or new design-system values are required.
- Does not change the pipeline company-data contract, backend behavior, accounts, analytics, cookies, or dependencies.
