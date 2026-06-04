## Why

The peek card and basemap drifted from the `map-overview` spec during a working-tree redesign: the card was restructured around the pentagon and made fully tap/drag-interactive, and the app-side basemap recolouring was dropped in favour of the stock Mapbox style under the wine bloom. The spec should match the shipped behaviour.

## What Changes

- Peek card layout: the pentagon renders first (above the identity row); identity and tagline follow.
- **BREAKING** (spec behaviour): the "in het echt" / "in real life" tagline callout is removed — the tagline is now plain inline text with no callout label or wash.
- **BREAKING** (spec behaviour): the standalone "open volledig profiel" CTA button is removed — the whole card is the primary affordance (tap or Enter opens the detail route; `role="button"`), and the entire card is the drag surface.
- An explicit close (✕) button is added in the top-right actions alongside the bookmark, replacing the "no explicit close button" rule.
- Basemap: app-side recolouring (`applyPaperMapStyle`) is removed. The map renders the stock Mapbox "light" style; only the `.map-atmosphere` bloom carries the wine skin over it.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `map-overview`: peek-card content/order, tagline-callout removal, CTA→whole-card navigation, explicit close button, and basemap-skin removal (basemap no longer applies the active skin; bloom still does).

## Impact

- Affects route `/` and `/en/` (shared map experience).
- Code: `src/components/PeekCard.tsx`, `src/components/MapView.tsx` (removed `applyPaperMapStyle`), `src/components/MapPage.astro`, `src/styles/global.css`, `src/lib/i18n/messages.ts` (added `close_label`).
- No pipeline data-contract impact.
