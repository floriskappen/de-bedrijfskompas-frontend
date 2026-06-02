## Context

The map overview currently renders as a full-screen Astro page with React islands for the Mapbox map, peek card, and language switcher. Existing motion is short, stepped, and CSS-driven where possible; the peek card uses `steps(...)` keyframes and respects `prefers-reduced-motion`.

This change adds an opening moment for the map page itself. It is decorative, but it affects first-load behavior on both map routes, so it belongs in `map-overview`.

## Goals / Non-Goals

**Goals:**

- Reveal the normal map from behind a paper-grain cover.
- Keep the motion short and stepped, matching the existing design language.
- Keep the map and chrome in their final layout while a non-interactive paper overlay temporarily covers them.
- Avoid interfering with Mapbox initialization, `?selected` deep-links, empty states, or locale routing.
- Disable the reveal for reduced-motion users.

**Non-Goals:**

- No full paper simulation, physics model, canvas animation, image frame sequence, or new animation dependency.
- No persistent first-visit tracking; refreshes replay the reveal.
- No broader visual-design-system pass.
- No data-contract or i18n changes.

## Decisions

### CSS shell animation, not React state

The reveal should live on the Astro page shell via CSS classes and pseudo-elements. This keeps it independent from island hydration and avoids introducing timing state into `MapView.tsx` or `PeekCard.tsx`.

Alternative considered: a React intro component controlling mount/unmount. That adds hydration ordering risk and can delay visible content. The CSS approach lets the map and overlays initialize normally while only their presentation is animated.

### Animate the whole map composition

The reveal should wrap the full `MapPage` surface rather than only the Mapbox canvas. Filters, language switcher, empty-state overlay, and peek card should sit on the same opening sheet.

Alternative considered: animate only the basemap underneath the chrome. That is easier but visually weaker, because controls would appear detached from the physical-map metaphor.

### Use overlay-only reveal

The effect should be an overlay-only animation: the Mapbox canvas and UI chrome stay in their normal layout while a paper-grain layer covers them and then reveals the map through stepped bloom-like openings plus a short fade.

Alternative considered: transforming or folding the map surface itself. That can break Mapbox canvas sizing/painting during refresh and makes UI chrome feel physically distorted, so the overlay approach is safer.

### Reduced motion removes the reveal

`prefers-reduced-motion: reduce` should disable the animation and hide any transient overlay. The map page should render directly in its final state.

Alternative considered: shorten the animation instead of removing it. For a decorative first-load effect, removal is the safer accessibility choice.

## Risks / Trade-offs

- A persistent overlay could block interaction → keep it pointer-events none and end at opacity 0/visibility hidden.
- The reveal could still feel too decorative → keep it short, low-fps, and built from existing paper/grain tokens rather than new imagery.
- Visual regression is subjective → pair browser-level assertions with manual review for timing and feel.
- CSS mask support can vary → pair mask reveal with opacity fade so the map still appears cleanly if masking degrades.
