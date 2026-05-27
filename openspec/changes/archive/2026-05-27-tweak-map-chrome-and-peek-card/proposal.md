## Why

Three small map-overview tweaks landed together: the peek card now shows a company's favicon when the pipeline provides one (the newly-fetched data exposes `favicon_url`), the bottom hint "N bedrijven in beeld · tik een pin" was removed because it adds noise without adding information, and a desktop hover glitch on cluster markers was fixed (Mapbox's `transform: translate(...)` was being overwritten by a `hover:scale-105` on the same element). The first two contradict claims already in the `map-overview` spec, so the spec needs to follow.

## What Changes

- Peek card header renders the company's favicon (52×52 paper-card tile with the favicon centred at 32×32) when `favicon_url` is present, falling back to the existing ink monogram tile on missing url or image-load failure.
- The bottom hint chrome element is removed entirely (component, i18n strings, and references).
- Cluster marker visual styling moved to an inner element so Mapbox's marker-positioning transform on the outer element is not clobbered by the hover transform. **Implementation-only — no spec impact.**

## Capabilities

### New Capabilities
*(none)*

### Modified Capabilities
- `map-overview`:
  - peek card header now describes a favicon-with-monogram-fallback identity tile, not a bare monogram
  - map-chrome requirement drops the bottom hint (filters pill + language switcher remain)
  - visual-design-system scenario no longer cites the bottom hint as a mono-utility-mark example

## Impact

- `src/lib/company-data/types.ts`: new optional `favicon_url?: string` on `Company`.
- `src/components/PeekCard.tsx`: conditional favicon tile with fallback-on-error.
- `src/components/MapPage.astro`, `src/components/BottomHint.tsx`, `src/lib/i18n/messages.ts`: bottom-hint code, component, and i18n keys removed.
- `src/components/MapView.tsx`: cluster marker DOM wrapped in an inner element to isolate hover transforms from the Mapbox-managed outer transform.
- No data-contract changes; `favicon_url` was already in the pipeline payload.
