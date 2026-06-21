## 1. Map Filter Storage Boundary

- [x] 1.1 Add a capability-owned map-filter storage module with the versioned `de-bedrijfskompas:map-filters:v1` key, payload schema, and safe read/write/clear helpers.
- [x] 1.2 Normalize stored axis minimums against the supported focus levels, normalize and deduplicate selected work-field ids against the supported domain ids, default invalid `favoritesOnly` values, and remove the key for all-default filters.
- [x] 1.3 Add unit test `map filters normalize malformed or obsolete storage` covering partial payloads, duplicate domains, unknown levels and domains, invalid booleans, and malformed JSON.
- [x] 1.4 Add unit test `map filters degrade safely when storage is unavailable` covering rejected reads, writes, and removals while retaining functional in-memory defaults.

## 2. Map Overview Integration

- [x] 2.1 Initialize `MapView` filter state synchronously from the storage helper so restored filters drive the first filtered company set, facet counts, active-filter count, clusters, and empty state.
- [x] 2.2 Persist every map filter state change through one centralized path, including axis sliders, work-field toggles, favorites-only, the test hook, and reset.
- [x] 2.3 Keep existing selected-company reconciliation after restored filters are available so matching selections reopen and ineligible `?selected` values are cleared.
- [x] 2.4 Ensure reset returns the UI to empty filters and removes only map-filter storage without changing favorites, BYOK configuration, or Ikigai history and draft keys.

## 3. Browser Behavior Coverage

- [x] 3.1 Add Playwright test `map filters survive reload` covering restored axis, work-field, and favorites-only state plus matching markers and active-filter count.
- [x] 3.2 Add Playwright test `map filters survive detail-page round trip` proving a matching company returns selected with its prior filters still active.
- [x] 3.3 Add Playwright test `restored map filters reconcile an ineligible selection` proving the persisted filters remain while the peek card and `selected` query parameter clear.
- [x] 3.4 Add Playwright test `map filters are locale-independent` proving filter identifiers persist from `/` to `/en/` and back while labels follow the current locale.
- [x] 3.5 Add Playwright test `map filter reset clears only persisted map filters` proving a reload stays at defaults while favorites, BYOK, and Ikigai browser payloads remain unchanged.

## 4. Verification

- [x] 4.1 Run the targeted map-filter storage unit tests and existing company-filter unit tests.
- [x] 4.2 Run the map-overview Playwright suite, including all persistence scenarios added by this change.
- [x] 4.3 Run `npx astro check` and the relevant production build or full test suite to catch integration regressions.
- [x] 4.4 Run OpenSpec validation/status for `persist-map-filters` and confirm implementation matches the proposal, design, and delta spec.
