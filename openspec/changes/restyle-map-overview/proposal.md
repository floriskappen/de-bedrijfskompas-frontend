## Why

The first cut of the map page used placeholder styling. The design bundle ("de ontwerp") now defines a hi-fi visual language — warm paper palette, single tomato accent, sharp corners, Archivo + JetBrains Mono — and a specific composition for the map overview (chrome pills, uniform ink pins, peek card with "in het echt" callout). Adopting it on `/` and `/en/` makes the existing route look like the real product instead of a wireframe; nothing about routing, data, or selection behaviour changes.

## What Changes

- Adopt the de-ontwerp tokens (paper, ink scale, red accent, Archivo + JetBrains Mono, paper-grain texture) as the project's base styles.
- Restyle pin rendering on the map: pins are uniform ink dots (no aggregate-score tiering). Selected pin gets a red halo ring.
- Restyle the peek card to match the hi-fi mock: monogram square + name + locality/distance header, "in het echt" tomato-soft callout wrapping the tagline, pentagon, primary CTA + inert bookmark — sharp corners throughout, drag handle on top, no explicit X button (Esc / tap-outside / tap-selected still clears). The company name and monogram preserve source casing as a documented exception to the lowercase rule.
- Add map chrome: an inert filters pill top-right (real filter behaviour is a later change) sharing one visual idiom with the language switcher. A small bottom hint shows the visible company count and a tap-a-pin nudge while no pin is selected.
- Restyle the pentagon to the hi-fi look (concentric rings, dashed null spokes, "?" glyph at center for null axes, red accent polygon, mono axis labels).
- Soften the geolocate button into a subtle floating affordance (smaller, low-contrast border, no heavy drop shadow).

**Out of scope (deliberate):** filters sheet/sliders (the Filters pill is inert chrome), distance-band controls, search, desktop-specific layout, real detail page styling. The Mapbox basemap style stays as-is — only the markers/chrome on top of it change.

## Capabilities

### Modified Capabilities

- `map-overview`: pin rendering and peek card content get the hi-fi treatment; new map chrome requirement adds the filters pill and bottom hint, and a new visual design system requirement codifies the de-ontwerp tokens and lowercase rule.

## Impact

- **Affected routes**: `/` and `/en/`.
- **No data-contract change**: the markers are uniform and read no scores at all; `computeAggregate` / `pinTier` helpers are removed as dead code (their only consumer was the previous tiered marker).
- **Visual constraints from the design system kick in globally**: lowercase user-visible copy is now enforced via `text-transform: lowercase` on `body`; mono utility marks opt back into uppercase + 0.08em tracking. Proper-name strings from the data contract (`company.name`, monogram) are the one documented exception and use `normal-case`.
- **Fonts**: Archivo + JetBrains Mono loaded from Google Fonts.
- **New asset**: `public/paper-grain-soft.svg` for the peek card / sheets background texture.
