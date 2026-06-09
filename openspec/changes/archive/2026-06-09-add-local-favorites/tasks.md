## 1. Local favorites store (capability: local-favorites)

- [x] 1.1 Add a browser-safe favorites helper for reading, writing, toggling, validating, and subscribing to local favorite company ids from `localStorage`.
- [x] 1.2 Use a versioned storage key and tolerate missing, malformed, duplicate, or non-string stored values.
- [x] 1.3 Dispatch/listen for a custom favorites-changed event and the native `storage` event so separate islands and tabs stay synchronized.
- [x] 1.4 Unit test empty storage, malformed storage, duplicate ids, toggle add/remove, and subscription notification.

## 2. Filter model (capability: map-overview)

- [x] 2.1 Add `favoritesOnly: boolean` to `CompanyFilters`, defaulting to `false`.
- [x] 2.2 Update `matchesCompanyFilters`/`filterCompanies` to accept a favorite id set and require membership only when `favoritesOnly` is true.
- [x] 2.3 Update active-filter detection/counting to include the favorites-only toggle.
- [x] 2.4 Update axis/work-field/favorites facet counts so favorites compose with the active axis and work-field filters.
- [x] 2.5 Update filter unit tests for favorite-only matches, favorite-only empty results, active filter counts, and facet counts with favorites enabled.

## 3. Map and peek-card UI (capability: map-overview)

- [x] 3.1 In `MapView.tsx`, subscribe to favorite ids and pass them into filtering.
- [x] 3.2 Replace the inert favorites placeholder with an enabled filter chip/toggle showing selected state and count.
- [x] 3.3 Ensure enabling favorites-only or unfavoriting the selected company clears hidden selection and removes `?selected=`.
- [x] 3.4 Add a discoverable favorites-page link in map chrome and/or the filter sheet using existing ontwerp icon-button/filter-chip patterns.
- [x] 3.5 In `PeekCard.tsx`, make the star button toggle the displayed company, reflect `aria-pressed`, and keep drag/tap propagation behavior intact.
- [x] 3.6 Playwright: save from peek card, reload and see state persist, enable favorites-only and see only saved companies, reset clears the favorite filter but does not remove saved favorites.

## 4. Detail-page UI (capability: company-detail)

- [x] 4.1 Subscribe to the favorite state for the current company.
- [x] 4.2 Make the top-bar star toggle favorite state with visible selected styling and localized add/remove labels.
- [x] 4.3 Playwright: save/remove from detail page and verify persistence on reload and map/peek-card state.

## 5. Favorites overview page (capability: local-favorites)

- [x] 5.1 Add Dutch `/favorieten/` and English `/en/favorites/` routes.
- [x] 5.2 Add a hydrated favorites page component that receives all companies, reads local favorite ids, filters unknown ids out, and renders the current favorites list.
- [x] 5.3 Render a localized empty state when no current favorites exist.
- [x] 5.4 Render each favorite with identity, locality, tagline, a compact score/axis summary, and a link to its detail route.
- [x] 5.5 Playwright: empty page state, saved-company list state, detail links, and locale-specific routes.

## 6. Copy, design, and verification

- [x] 6.1 Add localized lowercase labels for add favorite, remove favorite, favorites page, favorites-only filter, empty favorites, and favorites count.
- [x] 6.2 Reuse existing ontwerp tokens/classes for icon buttons, chips, page surface, and selected state; record any adopted adaptations in `.design/DESIGN.md`.
- [x] 6.3 Mark the three Favorites TODO.md items complete once implementation and tests pass.
- [x] 6.4 Run unit tests, relevant Playwright suites, and the build.

## 7. Design rework (post-implementation polish)

- [x] 7.1 Present the favorites-only filter as a switch at the top of the filter sheet (above the axes) instead of a chip; keep `#favorites-filter` + `data-favorites-filter` + `aria-pressed` + the count.
- [x] 7.2 Remove the in-sheet favorites-overview link; the overview stays reachable from the map chrome favorites button.
- [x] 7.3 Mark saved companies on the map with a small accent favorite star (top-right of the score tag), updating live via the favorites subscription, on both the Mapbox and fallback markers.
- [x] 7.4 Redesign the favorites cards: wine warm-surface token (`.is-warm-surface`), a peek-card-style identity header (favicon tile + name over locality, save star top-right), and a per-axis focus-meter compass summary (shared `FocusMeter` + `AxisGlyph`), dropping the cumulative score badge and the per-axis text tags.
- [x] 7.5 Update Playwright/`.design/DESIGN.md` for the switch, the pin mark, and the card; drop the obsolete overview-link assertion.
- [x] 7.6 Make the favorites cards open the detail page from the whole card (stretched link), keeping the save star clickable above it.
- [x] 7.7 Origin-aware detail back button: favorites→detail links carry `?from=favorites`; the detail back control returns to favorites (localized label) for that origin, and to the map otherwise.
