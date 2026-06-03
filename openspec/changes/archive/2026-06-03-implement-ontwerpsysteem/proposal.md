## Why

The frontend already has a paper-and-ink direction, but it is hand-rolled and undocumented. We should adopt the ontwerp design system the way its README prescribes so future UI work has a pinned source of truth, semantic values, recipes, and a local record of deviations.

## What Changes

- Add `floriskappen/ontwerpsysteem` as a `release`-branch submodule at `vendor/ontwerp`, pinned to the current release (`0.1.0` / exact submodule commit).
- Add `.design/DESIGN.md` from the shipped template and record adopted parts, adaptations, omissions, and propagation history.
- Add local agent guidance so any future UI work reads `vendor/ontwerp/AGENTS.md`, `language/`, `recipes/`, `zoo/`, and `values/` before changing UI.
- Wire the ontwerp value layer into the Astro/Tailwind build and replace local hardcoded visual defaults where practical.
- Apply the system to the existing map, filter panel, peek card, score badges, empty states, and profile chrome while preserving current map behavior and localization.
- No changes to the company data contract with the pipeline.

## Capabilities

### New Capabilities
- `design-system-consumption`: Covers how this app consumes, pins, documents, updates, and applies the ontwerp design system.

### Modified Capabilities
- `map-overview`: The map experience must render its UI surfaces, controls, markers, panels, and states using the pinned design system's values and recipes while preserving existing map interactions.

## Impact

- Affects project structure (`vendor/ontwerp`, `.design/DESIGN.md`, local agent guidance) and dependency metadata for the submodule.
- Affects shared styling in `src/styles/global.css`, Tailwind theme imports, font loading, and UI classes/components under `src/components/` and routes using the shared layout.
- Does not affect the pipeline, company JSON shape, score semantics, route structure, or i18n data contract.
