## Why

The map is the product's first developed page, and its first paint currently appears like a normal web UI. A short paper-cover reveal makes the opening moment feel like a map appearing on paper while staying consistent with the existing stepped motion language.

## What Changes

- Add a brief first-load reveal animation to the map experience on `/` and `/en/`.
- The reveal starts from a paper-grain cover and reveals the normal map underneath with stepped bloom-like openings and a short fade.
- The animation is decorative and MUST NOT delay map initialization, selection deep-links, or core interactions beyond the short reveal.
- Honor reduced-motion preferences by disabling the reveal.

## Capabilities

### New Capabilities
*(none)*

### Modified Capabilities
- `map-overview`: adds first-load reveal behavior for the map experience on both locale routes.

## Impact

- `src/components/MapPage.astro`: wrap or mark the full-screen map composition so the reveal applies to the whole map surface.
- `src/styles/global.css`: add stepped paper-cover reveal keyframes and reduced-motion handling.
- `tests/map-overview.spec.ts`: add browser coverage that the reveal surface exists and reduced-motion mode disables the animation.
- No pipeline data-contract changes.
