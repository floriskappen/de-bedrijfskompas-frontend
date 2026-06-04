## Context

The peek card and basemap were reworked in the working tree ahead of the spec. The card moved from a labelled, multi-block layout (identity → callout → pentagon → CTA button) to a pentagon-led card where the whole surface is the affordance, and the basemap's app-side recolouring was dropped. This design records the choices so the `map-overview` spec can be brought in line.

## Goals / Non-Goals

**Goals:**
- Match the spec to the shipped peek-card structure and interaction model.
- Match the spec to the basemap rendering (stock Mapbox style + wine bloom).

**Non-Goals:**
- Changing selection, URL state, geolocation/distance, pentagon null-score rendering, or locale behaviour — all preserved.
- Restyling the filter panel or clusters.

## Decisions

- **Whole card is the primary affordance, not a discrete CTA button.** The card is `role="button"`, tabindex 0; a tap or Enter opens the detail route, and the same surface is the drag target. Alternative — keep a separate "open volledig profiel" button — was dropped because the card already reads as one tappable object and the button competed with the drag gesture. Navigation still resolves to `/<id>/` or `/en/<id>/` (locale + slug preserved).
- **Tap vs drag is disambiguated by movement.** Pointer move beyond ~4px marks the gesture as a drag; releasing without real movement is treated as a tap (navigate). Drag-down past ~⅓ height closes; up-drag stays stiffly rubber-banded and capped.
- **Tagline is plain inline text, no callout.** The "in het echt" / "in real life" labelled wash is removed; the tagline renders as a plain paragraph under the identity row. Alternative — keep the callout — was dropped as visual noise once the pentagon leads.
- **Explicit close (✕) button added.** With the whole card tapping through to the profile, drag-down and tap-out are no longer the only ways to dismiss without navigating, so an explicit ✕ sits beside the bookmark. Both top-right buttons stop pointer propagation so they never start a drag or trigger navigation.
- **Pentagon leads the card.** It is the headline; identity (favicon/monogram + name + locality/distance) and tagline follow.
- **Basemap is left as stock Mapbox "light".** `applyPaperMapStyle` is removed; only the `.map-atmosphere` bloom (accent-soft + surface under multiply) carries the wine skin. Alternative — keep per-layer recolouring — was dropped as fragile against Mapbox style changes and largely hidden under the bloom anyway.

## Risks / Trade-offs

- [Whole-card tap could fire on an intended drag or an errant tap] → 4px movement threshold plus pointer capture; action buttons stop propagation.
- [No explicit "open profile" label may be less discoverable] → card carries an `aria-label` naming the CTA, and `role="button"` exposes the affordance to assistive tech.
- [Stock basemap shows default Mapbox colours under a thin bloom] → acceptable; the bloom and markers carry the identity, and the basemap was already exempt from the paper-grain requirement.
