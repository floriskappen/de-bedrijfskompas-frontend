## Why

The frontend has nothing beyond a placeholder. To unblock the rest of the project we need two foundations in place at once: the contract for what a *company* is (so every future page consumes it the same way) and the first page that puts companies in front of a user — the map at `/`. Doing both in one change is the smallest shippable slice; either alone would leave a useless intermediate state.

## What Changes

- Add a `company-data` capability defining the JSON shape produced by the pipeline (5 axes, null-allowed scores, evidence categories, `nl`/`en` blocks, `lat`/`lng`) and a single build-time access primitive the rest of the app uses to read it.
- Add a `map-overview` route capability at `/` (nl, default, no prefix) and `/en/` (english mirror): a Mapbox map, all companies as pins, score-coded styling, tap-to-select with a peek card showing tagline + pentagon + a CTA into the detail route.
- Configure Astro i18n routing with nl as the unprefixed default and english under `/en/`. URL state (selected pin, language switches) is preserved across the language toggle.
- Add a stub `/[slug]/` route so the peek card's "open volledig profiel" CTA navigates somewhere. Real detail content is a later change.
- Ship mock JSON data matching the contract (with `lat`/`lng` added) for now. The pipeline-emitted SQLite source is out of scope here.

**Out of scope (deliberate, to keep this change tight):** filters sheet, distance filter, search, real detail page content, desktop-specific layout.

## Capabilities

### New Capabilities

- `company-data`: the typed shape of a company record (axes, scores, evidence, status, i18n blocks, coordinates), the build-time access primitive, and the locale-selection rule for prose fields.
- `map-overview`: the `/` and `/en/` route experience — map render, pins, selection, peek card, and the language-switcher contract for this page.

### Modified Capabilities

_None — this is the first change._

## Impact

- **External contract**: depends on the pipeline emitting `lat`/`lng` per company (confirmed in-progress) and the field set in `temp_company_data_example.json`. The company JSON is a load-bearing interface even while the source is mock data.
- **New dependencies**: `mapbox-gl`, an Astro i18n config, and whichever lightweight island framework we land on for the interactive map (e.g. React or Preact via `@astrojs/react`).
- **Build**: mock company JSON committed under `src/data/` (final path tbd in design); Astro i18n flips on with `prefixDefaultLocale: false`.
- **Routes added**: `/`, `/en/`, `/[slug]/`, `/en/[slug]/`.
- **Env**: a public Mapbox access token required at build time.
