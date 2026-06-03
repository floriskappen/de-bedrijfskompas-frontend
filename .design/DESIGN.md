# Design system pin

- **System:** ontwerp design system
- **Pinned version:** 0.1.0
- **Pinned commit:** 82efa769979484cc2a0d4c2e016d6b817edfbc0b
- **Submodule path:** vendor/ontwerp
- **Last synced:** 2026-06-02

## Adopted

- Paper surface, ink text, accent colour, border, spacing, radius, typography, and component role values from `vendor/ontwerp/values/`.
- `material.surface.paper-grain` for page, panel, empty-state, and card surfaces.
- `component.button.ink-press` for app-owned buttons and icon controls.
- Field-as-gutter treatment for filter controls where the layout allows it.
- `motion.clock.stepped` for peek-card, filter-sheet, marker, and app-owned control motion.
- Mono utility marks remain uppercase with tracking; user-facing prose remains lowercase.
- Nature-as-behaviour principle for deterministic map rosettes around collocated company pins.

## Deviations (by exception only)

### Adapted

- Mapbox map canvas is repainted at runtime into the paper world via dedicated muted map tones (`--map-land/-warm/-water/-road/-label`) — the wine tint held to roughly a fifth of the page-surface saturation so the basemap reads as calm paper, not a red glow, while the page surfaces stay fully wine. App-owned overlays, controls, markers, and states carry ontwerp values on top.
- Score badges and pentagon scores, filter histograms, and geolocation markers are app-specific map UI; markers are tactile paper tags (paper tooth, ink score, accent indicator dot, thick bottom border, Ben-Day dot screen, stepped press), selected pins invert to ink.
- A soft warm bloom (`atmosphere.weather` blooms) plus paper grain is applied only at the map corners, kept transparent in the centre so it never competes with marker legibility; with the basemap now muted, the corner bloom carries the full wine warmth (accent + deep-surface stops) as the only saturated colour on the map field; the breathing-grid is still omitted over the map.
- The peek card sits on a softened light-wine surface (the full wine card surface read too dark/red on the map); its inset tagline callout and identity tile use a faint accent wash (`--wash-wine`) so they read as themed rather than the cream baseline. The filter sheet and its inset filter cards are held on a lighter, quieter surface (`--filter-surface` / `--filter-card-surface`) so the controls — not the panel — carry the colour.

### Omitted

- `motion.weather.wind`, `motion.weather.rain`, and related weather particle recipes: no product use case in the map overview yet.
- `state.loading.germinating` and `state.done.ripe`: the current static build has no user-visible async loading or task-completion workflow.
- Theme swapping recipes: the app ships one pinned paper/ink theme.

### Extended

- `.map-rosette-pins`: app-specific collocated marker layout; follows nature-as-behaviour and deterministic phyllotaxis.
- `.score-badge` / map cluster markers: app-specific compact map marks; follows component badge and ink-press principles.
- `.score-pentagon`: app-specific five-axis data visualisation; follows semantic values and distinct no-signal state handling.
- `.filter-sheet`: app-specific mobile bottom sheet; follows paper surface, field/gutter, badge, and stepped-motion recipes; shares the peek card's exact stepped slide in/out plus a fading backdrop so the two sheets feel like one object.
- `material.pigment.multiply-blot` on cluster markers: a cluster is rendered as pure pigment — no paper tile, border, or button chrome. A soft organic blot of layered wine/ink dye (accent-soft + ink-soft + accent-base) in a near-circle bleed carries the count in white, following the zoo pigment plate.
- `.filter-chip` active state: a selected tag fills with the accent colour, inverts to on-ink text, and holds the pressed-down state (raised bottom border collapsed), so "selected" is unmistakable; taps also snap down immediately via a transition-free `:active` press.
- `.map-atmosphere`: corner-only warm bloom + paper grain over the recoloured basemap; carries the wine warmth that the basemap itself no longer does.
- `.map-reveal-surface` first-load transition: the releasing paper cover and the bloom that shows through carry wine + amber pigment (accent-soft, amber, accent-base) so the page-load reveal is themed, not a plain white wipe.

## Propagation log

- 2026-06-02 none -> 0.1.0: initial adoption; reviewed `AGENTS.md`, `brief.md`, `language/`, `recipes/index.json`, `values/`, and zoo component/material examples; recorded adopted, adapted, omitted, and extended parts.
- 2026-06-03 0.1.0 design pass: recoloured the Mapbox basemap into paper tones with a corner bloom; markers became tactile paper tags with an accent indicator dot (selected inverts to ink); clusters gained a multiply pigment blot; tag chips gained the Ben-Day dot screen; filter sheet now shares the peek card's stepped enter/exit + backdrop fade; active-filter count badge made visible (accent + paper ring); floating filter pills and the peek-card score/place/distance strip removed; peek card uses a warm card surface and its primary CTA uses the accent button.
- 2026-06-03 0.1.0 wine intensity refinement (third pass): introduced dedicated muted map tones so the basemap wine tint dropped to ~a fifth; reworked clusters from a paper-tile button into pure layered pigment with a white numeral; lightened the peek card to a softened light-wine surface and moved its tagline callout + identity tile onto a faint accent wash (no longer reading as cream); held the filter sheet, its header, and inset filter cards on a lighter, quieter surface; made active tag chips fill with the accent colour and hold the pressed-down state, with an immediate transition-free press on tap. Follow-up: kept the corner bloom at full wine warmth (it is now the only saturated colour on the muted map field) and gave the first-load reveal transition wine + amber pigment so the page load reads as themed.
