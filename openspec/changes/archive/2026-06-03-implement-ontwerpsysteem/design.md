## Context

The app currently implements a warm paper, ink, and stepped-motion visual language directly in `src/styles/global.css` and Tailwind class strings. The ontwerp repository now provides that language as a pinned consumer bundle with `AGENTS.md`, semantic values, language notes, recipes, fonts, and the zoo reference.

The design-system README is explicit: consuming apps should not vendor the full development repo. They should add the `release` branch as a submodule under `vendor/ontwerp`, pin it to an exact release tag/commit, copy the pin-file template to `.design/DESIGN.md`, and treat the vendored bundle as the local source of truth.

## Goals / Non-Goals

**Goals:**
- Integrate ontwerp exactly as a consuming app: submodule, exact pin, local pin file, and agent guidance.
- Replace local design constants with ontwerp semantic/component values wherever the app renders UI.
- Preserve current routes, map behavior, filtering, selection, score/null semantics, and localization.
- Record all deliberate adaptations and omissions in `.design/DESIGN.md`.

**Non-Goals:**
- Do not change the ontwerp source repository.
- Do not copy the full design-system development repo into this app.
- Do not change the pipeline JSON contract or company data access layer.
- Do not introduce a general component library abstraction before the app needs one.

## Decisions

1. **Use a pinned submodule, not copied files.**
   The README’s Case 1 flow is authoritative for existing apps. A submodule keeps the source auditable, lets future updates be deliberate, and avoids silently diverging from the release bundle. Copying only token files would be simpler short term but would lose recipes, language, changelog, and propagation guidance.

2. **Make `.design/DESIGN.md` the app-local adoption record.**
   The vendored bundle explains the system; the app pin file explains this app’s choices. It should list adopted recipes such as paper grain, ink-press controls, stepped motion, and deterministic rosette behavior, plus adaptations such as map-specific markers and any omitted weather/ambient effects.

3. **Import ontwerp values before app overrides.**
   `global.css` should import `vendor/ontwerp/values/css/tokens.css`, and Tailwind v4 should import the ontwerp Tailwind theme if it compiles cleanly in this Astro/Vite setup. App-specific variables may alias to semantic/component tokens, but new raw color/type/spacing values should be avoided unless recorded as an extension.

4. **Self-host fonts from the bundle.**
   The app currently loads Google Fonts. The design bundle ships fonts and the README calls out serving `vendor/ontwerp/fonts/*.woff2` or lifting `@font-face` from the zoo. Self-hosting keeps the app aligned with the pinned release and avoids an external runtime font dependency.

5. **Treat the map UI as an app-specific extension of ontwerp.**
   Mapbox controls, score pins, clustering, rosettes, pentagon scores, and bottom sheets are domain UI, not design-system primitives. They should be derived from the values and recipes: square paper surfaces, semantic ink/accent roles, mono utility marks, stepped motion, hard-cut controls, and deterministic nature-as-behavior patterns.

6. **Preserve behavior tests and add conformance checks where practical.**
   Existing unit and Playwright tests should continue to verify map behavior. New tests should focus on integration invariants that can regress: pin file exists, submodule path exists, token import is present, Google font import is gone, and visible map controls avoid default/system-blue styling.

7. **Theme the map atmospherically, not literally — keep tinting subtle and legible.**
   The wine skin is applied to the basemap and large background surfaces through dedicated muted tones rather than the full-strength page surfaces, so the map and the panels carry only a faint wash of the theme. Saturated wine is reserved for intentional accents — the CTA, active tags, the cluster pigment, indicator dots — where colour is doing a job. Cluster pigment and other dark themed marks must keep their numerals/text legible (white on pigment), and ambient blooms must stay subtle enough not to compete with marker legibility.

## Risks / Trade-offs

- Submodule availability in CI and deployment -> document setup and ensure the committed gitlink plus `.gitmodules` are present.
- Tailwind import path compatibility may differ from plain CSS imports -> prefer the CSS token import as the minimum viable value layer and add Tailwind theme import only if verified.
- The app’s existing classes use local names like `bg-paper` and `text-ink` -> keep compatibility aliases mapped to ontwerp values to avoid a noisy rewrite.
- Some Mapbox internals still render outside app CSS control -> constrain app-owned overlays and markers, and do not try to restyle Mapbox internals unless necessary.
- The design system rejects smooth/default transitions, but the current app has some hover opacity/scale utilities -> convert app-owned interactions to immediate or stepped behavior during implementation.
