## Context

`MapView` owns one `CompanyFilters` state object containing five axis minimums, selected work-field domain ids, and the favorites-only flag. It currently initializes that object to empty values on every mount. Navigating to a static detail route destroys the map island, so both returning to the map and refreshing it lose the filter state.

The application already uses capability-owned browser stores rather than a generic persistence layer: favorites, BYOK configuration, and Ikigai history/drafts each have separate versioned keys, normalization, and read/write helpers. Ikigai also persists axis minimums, but those values describe a matching run and must not become coupled to the map overview's browsing filters.

## Goals / Non-Goals

**Goals:**

- Restore map filters synchronously whenever the map island mounts.
- Persist all `CompanyFilters` fields across refreshes, detail round trips, and locale changes.
- Tolerate malformed and stale browser data without weakening the pure filter helpers.
- Preserve current selection reconciliation, reset semantics, and favorite storage.

**Non-Goals:**

- Synchronize map filters with Ikigai run or draft filters.
- Persist map center, zoom, selected company, geolocation, or open-sheet state.
- Add accounts, backend persistence, cookies, analytics, or a general storage framework.
- Change filter semantics, filter UI, the design-system pin, or the pipeline data contract.

## Decisions

**Use a capability-owned map-filter storage module.** Add a browser-only boundary such as `src/lib/map-filters/storage.ts` that imports the filter types and allowed identifiers but keeps `localStorage` access out of `src/lib/company-data/filters.ts`. Reusing Ikigai storage would couple independent user journeys; creating a generic repository-wide store would add abstraction without a second shared behavior.

**Store a normalized, versioned payload under a dedicated key.** Use a key such as `de-bedrijfskompas:map-filters:v1` and a payload containing `schemaVersion`, `axisMinimums`, `selectedDomains`, and `favoritesOnly`. Normalization accepts only known axis levels and domain ids, fills missing axes with `none`, deduplicates domains, and defaults invalid booleans to `false`. This follows the stronger Ikigai storage pattern while keeping map data independent.

**Hydrate through the React state initializer.** Initialize `filters` with `readMapFilters()` rather than loading storage in a post-render effect. `MapView` is a `client:only` island, so the initializer can read browser state without a server hydration mismatch. This ensures clustering, counts, empty state, and `?selected` reconciliation all see restored filters from the first client render.

**Persist centrally when filter state changes.** A filter-state effect writes the normalized state so sliders, domain toggles, favorites-only, the E2E test hook, and future mutations cannot bypass persistence. Writing the all-default state removes the storage key, making reset canonical and avoiding a permanent empty payload. Storage reads, writes, and removals are guarded so denied or unavailable storage degrades to in-memory state.

**Keep existing selection reconciliation authoritative.** The current effect clears `?selected` when the selected company is not in the filtered id set. Restoring filters before that effect means a matching detail-page return reopens the peek card, while a company that became ineligible on the detail page—such as an unfavorited company under favorites-only—is cleared consistently.

**Do not add live cross-tab synchronization.** The map has one filter-state owner and the requested journeys remount or reload it. Favorites need events because multiple visible islands consume them; map filters do not. A different tab will read the latest filters on its next reload, avoiding storage-event feedback and unnecessary state machinery.

## Risks / Trade-offs

- [Risk] A future axis level or work-field identifier makes stored data stale. → Normalize against the current exported identifier sets and ignore unknown values.
- [Risk] Browser storage access throws because of privacy settings or quota. → Catch storage operations and continue with functional in-memory filters.
- [Risk] Restored filters hide a `?selected` company. → Apply existing filtered-selection clearing after restored state is present.
- [Risk] Persisted favorites-only can produce an empty map after favorites or company data change. → Preserve the preference and rely on the existing active-count, empty state, and reset affordance rather than silently changing intent.
- [Trade-off] Filter changes in another open tab are not reflected live. → Cross-tab behavior is outside scope; reload and navigation still restore the most recently written state.

## Migration Plan

No migration is required: visitors without the new key receive the current empty defaults. Deployment begins writing the versioned key on the first filter change; rollback leaves an inert browser key that older code ignores.

## Open Questions

None.
