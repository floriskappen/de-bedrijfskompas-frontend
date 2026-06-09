## Context

Favorites are user-specific but the site is static. The company records are build-time data, and the stable identifier is `company_id`, already used for routes and URL selection. The active filters-page change has already added a non-functional favorites filter placeholder and changed axis filtering to level minimums. This change should build on that post-filter shape rather than reworking the filter sheet again.

Current relevant surfaces:

- `PeekCard.tsx` has a star/bookmark action in the top-right action group.
- `CompanyDetail.tsx` has a matching top-bar bookmark action.
- `MapView.tsx` owns filter state and the filtered company set.
- `MapPage.astro` renders `MapView` and `PeekCard` as separate client islands, so React props alone cannot synchronize favorite state between them.

## Goals / Non-Goals

**Goals:**

- Save and remove favorites entirely in the browser.
- Keep favorite state consistent across map pins/filtering, peek card, detail page, favorites page, and multiple tabs.
- Let the favorites filter compose with axis and work-field filters.
- Provide a simple dedicated list overview for saved companies.
- Preserve the static, local-only privacy story.

**Non-Goals:**

- Accounts, backend persistence, sync, analytics, or server reads of favorite state.
- Changing the pipeline schema or company records.
- Ranking, notes, folders, export, or sharing favorites.
- Persisting a favorite for a company that no longer exists in current build data as visible UI.

## Decisions

**Store only stable ids in localStorage.** Use a versioned key such as `de-bedrijfskompas:favorites:v1` and store an array of `company_id` strings, or an object with a `companyIds` array. The UI derives names, taglines, scores, and routes from current static company data. This avoids stale denormalized company snapshots and keeps storage small.

**Browser store is tiny and evented.** Add a frontend-only helper around localStorage with:

- `readFavoriteIds(): string[]`
- `isFavorite(id): boolean`
- `toggleFavorite(id): string[]`
- `subscribeFavorites(listener): () => void`

Writes dispatch a custom event, for example `bedrijfskompas:favorites-changed`, and listen to the native `storage` event so separate tabs update. Helpers must guard `typeof window === "undefined"` so imports are safe during Astro builds and tests.

**Favorites are independent of locale.** Store ids only. Labels and routes are locale-specific at render time (`/favorieten/` and `/en/favorites/`; detail links use `/{id}/` and `/en/{id}/`). A favorite saved in Dutch appears in English and vice versa.

**Filtering remains pure; localStorage stays outside company-data filters.** Extend `CompanyFilters` with `favoritesOnly: boolean`, but pass the current favorite id set into pure matching/filter helpers instead of reading localStorage from `filters.ts`. That keeps tests deterministic and keeps the data/filter capability usable without a browser.

```
localStorage
    |
    v
favorites store ---- custom event ----> PeekCard star
      |                                  Detail star
      |                                  Favorites page
      v
MapView favoriteIds + filters.favoritesOnly
      |
      v
filterCompanies(companies, filters, favoriteIds)
```

**Favorites filter composes like any other facet.** `favoritesOnly` is inactive by default and contributes one active-filter count when enabled. When active, a company matches only if its id is in the favorite id set and it also satisfies axis/work-field filters. Facet counts should use the same exclusion pattern as existing filters: the favorites chip count represents favorites matching the other active filters, and axis/work-field counts reflect the active favorites constraint unless that facet is being excluded.

**Selected company clearing follows existing filter behavior.** If the current selection stops matching because the user enables favorites-only or removes that company from favorites, the peek card closes and `?selected=` is removed, just like with other filters.

**Bookmark buttons are toggles, not navigation.** The peek-card and detail buttons should use `aria-pressed`, localized labels (`add favorite` / `remove favorite` equivalents), and a filled/active visual state. They should not navigate and should keep stopping card drag/tap propagation in `PeekCard`.

**Favorites page is a hydrated static page.** Astro can pass all build-time companies into a client component. The component reads local favorites after hydration, filters unknown ids out of the visible list, and renders:

- top control back to the map,
- a localized title/count,
- empty state when no current favorites exist,
- a list of saved companies with identity, locality, tagline, composite score/pentagon summary as appropriate, and links to detail pages.

**Expose the page without crowding the map.** Best implementation: add a compact icon-only favorites page button to the map chrome near the existing about button, and include a text/icon link from the filter-sheet favorites section. The map chrome button makes the page discoverable after saving from a peek card; the filter-sheet link connects the favorites-only filter to the list overview.

## Risks / Trade-offs

- **Hydration mismatch risk:** the server cannot know localStorage. Render neutral/empty client-owned state until hydration, then fill in favorite state. Avoid server-rendering a misleading saved list.
- **Cross-island synchronization:** `MapView` and `PeekCard` are siblings, so shared React state is awkward. The evented store is the smallest practical bridge.
- **Stale ids after data changes:** ignore unknown ids in UI. Optionally prune unknown ids when a known company list is available, but do not block rendering on cleanup.
- **Filter helper signature churn:** adding favorites to filtering affects tests and call sites. Keep localStorage out of that layer to contain the change.
- **UI crowding:** adding a favorites chrome button must be checked on mobile with the existing about/filter/geolocate controls. If crowded, keep the chrome button as an icon beside about, not a new large label.

## Open Questions

- Should the favorites page list include a small pentagon, just a composite score badge, or both? My preference is a compact score badge plus axis-level summary, because the detail page already carries the full pentagon.
- Should an empty favorites-only filter show the general filtered empty state or a more specific "no favorites yet" line inside the sheet? The map empty overlay can stay general; the sheet should show the favorite count as `0`.
- Should the old `bookmark_label` i18n key be renamed to `favorite_add_label`, or kept for compatibility and paired with a new remove label? Keeping it and adding a remove label is lower churn.
