## Why

The app already points toward favorites: the peek card and detail page have bookmark affordances, the active filters-page change includes an inert favorites filter placeholder, and the TODO calls out local-only favorites as the next user-specific feature. Right now those controls do nothing, so users cannot keep a shortlist or narrow the map to companies they want to revisit.

This change turns favorites into a complete local browser feature: save/remove companies, filter the map to favorites, and browse a dedicated favorites overview. It stays intentionally client-side only: no accounts, no backend, no tracking, and no pipeline data-contract change.

## What Changes

- Add a browser-only favorites store persisted in `localStorage`, keyed by stable `company_id` values and synchronized across hydrated islands with a custom browser event plus the native `storage` event.
- Make the bookmark/star controls in the map peek card and company detail top bar toggle the current company as a favorite, with visible selected state and localized add/remove labels.
- Add a real favorites-only toggle to the filter sheet, presented as a switch at the top of the panel (above the axes), not a chip among the work-field tags. It participates in active-filter counts, empty states, selected-company clearing, and facet/distribution counts. The favorites overview is reached from the map chrome favorites button, so the sheet carries no separate overview link.
- Mark saved companies on the map: their marker carries a small accent favorite star (top-right of the score tag) that updates live as favorites change.
- Add a dedicated favorites overview page: Dutch `/favorieten/`, English `/en/favorites/`. It renders from static company data, then hydrates client-side to show only locally saved favorite companies, each as a calm paper card with a per-axis focus-meter compass summary (no cumulative score badge or text tags).
- Add focused tests for storage parsing, toggle behavior, map filtering, bookmark controls, the favorites filter, and the favorites page empty/list states.

## Capabilities

### New Capabilities

- `local-favorites`: local browser persistence, save/remove behavior, favorite state synchronization, and the favorites overview page.

### Modified Capabilities

- `map-overview`: bookmark affordance becomes functional; filter sheet gains a real favorites-only toggle; map filtering accounts for favorite state.
- `company-detail`: top-bar bookmark affordance becomes functional and reflects persisted favorite state.

## Impact

- New likely code: `src/lib/favorites.ts` and/or `src/lib/favorites.test.ts`; `src/components/FavoritesPage.tsx`; routes `src/pages/favorieten.astro` and `src/pages/en/favorites.astro`.
- Touched likely code: `src/components/MapView.tsx`, `src/components/PeekCard.tsx`, `src/components/CompanyDetail.tsx`, `src/lib/company-data/filters.ts`, `src/lib/company-data/filters.test.ts`, `src/lib/i18n/messages.ts`, `src/styles/global.css`, and Playwright coverage in `tests/map-overview.spec.ts` plus a new or existing favorites-page spec.
- Design: use existing ontwerp icon buttons, filter chips, paper/grain surfaces, mono utility marks, and stepped state changes. No new raw design tokens should be introduced; any adopted adaptations should be recorded in `.design/DESIGN.md`.
- No API, account, backend, analytics, or pipeline data-contract impact.
