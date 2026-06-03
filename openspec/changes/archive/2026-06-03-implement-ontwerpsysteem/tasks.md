## 1. Vendor And Pin Ontwerp

- [x] 1.1 Add `floriskappen/ontwerpsysteem` as a git submodule on the `release` branch at `vendor/ontwerp`.
- [x] 1.2 Check out the current exact release tag/commit in `vendor/ontwerp` and verify `vendor/ontwerp/VERSION` reports `0.1.0`.
- [x] 1.3 Copy `vendor/ontwerp/templates/DESIGN.md` to `.design/DESIGN.md` and fill pinned version, pinned commit, submodule path, last synced date, adopted items, adaptations, omissions, extensions, and propagation log.
- [x] 1.4 Add local repository agent guidance (`AGENTS.md` or equivalent) naming `vendor/ontwerp/` as design authority and requiring the vendored read order for UI work.

## 2. Wire The Value Layer

- [x] 2.1 Import `vendor/ontwerp/values/css/tokens.css` before app-specific rules in `src/styles/global.css`.
- [x] 2.2 Replace local raw design variables with aliases to ontwerp semantic/component tokens while preserving existing utility class compatibility where needed.
- [x] 2.3 Serve Archivo and JetBrains Mono from the pinned bundle or local assets derived from it, and remove the Google Fonts `@import`.
- [x] 2.4 Verify whether `vendor/ontwerp/values/tailwind/theme.css` can be imported cleanly with Tailwind v4/Astro; import it if compatible, otherwise document the CSS-token-only choice in `.design/DESIGN.md`.

## 3. Apply Ontwerp To App-Owned UI

- [x] 3.1 Update shared page/layout surfaces, selection, typography, lowercase/mono utility treatment, and paper grain to consume ontwerp tokens.
- [x] 3.2 Update map pins, clusters, selected-pin halo, unknown-score badges, user-location marker, and fallback map markers to avoid default blue/rounded/system styling and use ontwerp-compatible values.
- [x] 3.3 Update filter button, active-count badge, filter sheet, reset/close controls, sliders, histograms, and tag chips to follow ontwerp button/field/badge/surface recipes.
- [x] 3.4 Update peek card, identity tile, tagline callout, CTA, bookmark affordance, and empty states to use ontwerp paper/ink/accent values and square/tactile component treatment.
- [x] 3.5 Replace app-owned generic smooth opacity/scale transitions with immediate, stepped, or reduced-motion-aware behavior.
- [x] 3.6 Record map-specific extensions, adaptations, and omissions in `.design/DESIGN.md`.

## 4. Tests And Verification

- [x] 4.1 Add a design-system integration test named `design-system bundle is pinned` covering the vendored release bundle and exact pin scenarios.
- [x] 4.2 Add a design pin test named `design pin records current adoption` covering current adoption and propagation-log scenarios.
- [x] 4.3 Add an agent guidance test or static check named `ui work has local design read path` covering the local read-path scenario.
- [x] 4.4 Add a value-layer test named `ontwerp values are imported` covering CSS token import, local aliases, and bundled font scenarios.
- [x] 4.5 Add or update Playwright coverage named `map ui uses pinned ontwerp values` for `/` and `/en/` map chrome, markers, overlays, and state treatments.
- [x] 4.6 Add or update Playwright coverage named `map behavior survives ontwerp reskin` for selection, clusters, filters, URL state, peek card, locale, and geolocation fallback.
- [x] 4.7 Add or update Playwright/static coverage named `map interactions use stepped or immediate motion` for peek card, filter sheet, buttons, controls, and reduced-motion behavior.
- [x] 4.8 Run `npm run test`, `npm run test:e2e`, and `npm run build` after implementation.

## 5. Wine Intensity Refinement (Third Pass)

- [x] 5.1 Hold the recoloured basemap to a faint wine wash via dedicated muted map tones (`--map-land/-warm/-water/-road/-label`) read by `applyPaperMapStyle` so the map no longer reads as a red glow, while keeping the `.map-atmosphere` corner bloom at full wine warmth as the only saturated colour on the map field.
- [x] 5.7 Give the first-load `.map-reveal-surface` transition wine + amber pigment (accent-soft, amber, accent-base) in both the releasing paper cover and the bloom that shows through, so the page-load reveal reads as themed rather than a plain white wipe.
- [x] 5.2 Rework the cluster marker from a paper-tile button into pure pigment — a layered organic blot of wine/ink dye carrying the count in white, with no border/tile/dot-screen chrome.
- [x] 5.3 Lighten the peek card onto a softened light-wine surface, and move its tagline callout and identity tile onto a faint accent wash (`--wash-wine`) so they read as themed rather than cream.
- [x] 5.4 Hold the filter sheet, its sticky header, and inset filter cards on a lighter, quieter surface (`--filter-surface` / `--filter-card-surface`).
- [x] 5.5 Make active tag chips unmistakable: fill with the accent colour, invert to on-ink text, hold the pressed-down state, and snap down immediately on tap via a transition-free `:active` press.
- [x] 5.6 Record the refinement in `.design/DESIGN.md` (adapted/extended notes + propagation log) and re-run `npm run test`.
