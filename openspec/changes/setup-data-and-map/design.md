## Context

The repo currently has a placeholder Astro page and an OpenSpec config; nothing else. This change lays the two foundations everything else builds on: how a company is shaped (`company-data`) and the first route a user can interact with (`map-overview`). The data source long-term will be a SQLite blob produced by the pipeline; for now it's mock JSON files matching that contract. The pipeline is adding `lat`/`lng` to its output in parallel with this change.

## Goals / Non-Goals

**Goals:**
- A working map at `/` (nl) and `/en/` showing real companies as pins, with a peek card on tap.
- A single, typed way for any page in the app to load company data.
- i18n routing wired up such that adding pages later is mechanical, not architectural.
- A foundation that survives the eventual switch from mock JSON to pipeline-emitted SQLite without spec churn.

**Non-Goals:**
- Filters, distance, search, real detail page content, desktop-specific layout (later changes).
- Geolocation. The map has a fixed default view; "near me" comes with the distance filter.
- Pin clustering and tile-style theming beyond Mapbox's stock light style.

## Decisions

### Map library: Mapbox GL JS

**Chosen:** Mapbox GL JS with a public access token, domain-restricted via the Mapbox dashboard.
**Alternatives:** MapLibre GL (Mapbox fork, no token) — viable but Mapbox's stock styles and geocoder will likely be useful as we add filters/distance later. Leaflet — too raster-feeling for the editorial design language. **Why:** the design's map is illustrative, but the production map should be vector with restrained styling, and Mapbox is the path of least resistance to that look. Token exposure is acceptable for a public access token with domain restriction.

### Island framework: React via `@astrojs/react`

**Chosen:** React for interactive islands (the map widget, the peek card state, the language toggle).
**Alternatives:** Preact (smaller runtime) or Solid (smaller, faster) — both viable; rejected because the design bundle is written in React and Mapbox's first-class examples are React. **Why:** familiarity wins for v1; we can swap to Preact later if bundle size matters. Only the map route hydrates an island, so the runtime cost is bounded.

### i18n routing: Astro built-in, `prefixDefaultLocale: false`

**Chosen:** `defaultLocale: 'nl'`, `locales: ['nl', 'en']`, **dutch at unprefixed paths**, english under `/en/...`. Slugs stay dutch on both sides (e.g. `/en/assen/`, not `/en/axes/`).
**Alternatives:** prefix both (`/nl/` + `/en/`) — uniform but uglier for the default audience. Runtime toggle without URL changes — bad for SEO and bookmarking. Per-language slug translation — extra layer of indirection we don't need yet. **Why:** dutch is the default audience and deserves the clean URL; english readers tolerate dutch slugs in v1.

### URL state for selection

**Chosen:** selected pin lives in a query param, `?selected=<company-id>`. Filter values, when added, will join the same querystring. Language toggle preserves path tail + querystring.
**Alternatives:** in-memory only (no shareable links, no deep linking from a detail page). Hash fragment (works but plays badly with future SSR/prerender choices). **Why:** querystring is the cheapest way to make pin selection survive reloads and language switches, and is the natural extension point when filters arrive.

### Data loading: build-time JSON via a single access primitive

**Chosen:** `src/data/companies/*.json` (one file per company), loaded at build time via `import.meta.glob` behind a single typed function the rest of the app imports from. The function is the contract; the source file format is private.
**Alternatives:** one big `companies.json` array (simpler but discourages per-file diffs and merge-friendliness). Fetch from a URL at build time (premature; we don't have the URL yet). **Why:** keeping the source format private behind an access function means the swap to SQLite later is a one-file change, not a spec change.

### Null-score handling in v1

**Chosen:** null-score companies render as pins (using the faintest style from the design system) and have null cells in the pentagon. No filtering, no special UI affordance beyond visual de-emphasis.
**Alternatives:** hide null-score companies (loses information). Special "no data" badge (adds UI surface we don't have a design for yet). **Why:** the n/a UX is a filter-screen concern; for the map-only v1, "render and de-emphasize" is honest and minimal.

## Risks / Trade-offs

- **Mock-data drift** → the mock JSON could diverge from what the pipeline actually emits. Mitigation: the `company-data` spec is the source of truth; we re-sync the mock data the moment the pipeline ships its first real export, and use the spec's contract to validate.
- **Mapbox token leakage** → token is public by design but should be domain-restricted in the Mapbox dashboard before deploy. Captured as a deploy-time checklist item, not a code concern.
- **React bundle on the landing page** → the map is the landing page, so the island hydrates immediately. Acceptable for v1; revisit if Lighthouse scores demand it.
- **English-with-dutch-slugs** → `/en/assen/` is mildly awkward for english readers. Acceptable until we have enough english traffic to justify the translation layer.

## Open Questions

- Default map view: centered on Amsterdam with a fixed zoom, or fit-bounds to all pins? Probably auto-fit-bounds, but defer to spec.
- Pin clustering: not needed for v1's ~10s of companies; revisit when the dataset grows past ~100.
