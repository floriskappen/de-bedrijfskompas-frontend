## 1. Project setup and dependencies

- [x] 1.1 Install runtime deps: `mapbox-gl`, `@astrojs/react`, `react`, `react-dom`
- [x] 1.2 Register `@astrojs/react` in `astro.config.mjs`
- [x] 1.3 Install dev deps: `@playwright/test`, `vitest`, `@types/react`, `@types/react-dom`
- [x] 1.4 Configure Astro i18n in `astro.config.mjs`: `defaultLocale: 'nl'`, `locales: ['nl', 'en']`, `prefixDefaultLocale: false`
- [x] 1.5 Document `MAPBOX_PUBLIC_TOKEN` in `.env.example` and the project README

## 2. Mock company data

- [x] 2.1 Create `src/data/companies/` directory
- [x] 2.2 Author at least 6 mock company JSON files covering these fixture cases: one with aggregate score ≥80, one ≥70 and <80, one <70, one with every axis `score: null`, one with `status` other than `"ok"`, and one missing an optional field (`website` or `address`)
- [x] 2.3 Add valid Amsterdam-region `lat`/`lng` to every mock for visual coherence on the map

## 3. company-data capability

- [x] 3.1 Author Company TypeScript types in `src/lib/company-data/types.ts` matching the spec contract (5 fixed axis ids, evidence enum, locale blocks)
- [x] 3.2 Implement `loadRaw()` using `import.meta.glob('src/data/companies/*.json', { eager: true })`
- [x] 3.3 Implement `validate(record)` returning `{ ok, errors }` enforcing required fields, status, and coord ranges
- [x] 3.4 Implement `getAllCompanies(): Company[]` — drops non-renderable records, emits a build warning for each
- [x] 3.5 Implement `getCompanyById(id): Company | undefined`
- [x] 3.6 Implement `getLocalizedField(record, locale, fieldPath)` with one-step fallback to the other supported locale

## 4. Routing and i18n chrome

- [x] 4.1 Add `t(key, locale)` helper backed by `src/lib/i18n/messages.ts` with `nl`/`en` string maps
- [x] 4.2 Author the UI strings needed for the map page in both locales: page title, peek card CTA, bookmark aria-label, empty-state copy, language switcher label
- [x] 4.3 Add a URL-based locale detection helper for use in client islands

## 5. Map page shell

- [x] 5.1 `src/pages/index.astro` renders the nl map page
- [x] 5.2 `src/pages/en/index.astro` renders the en map page using the same shared MapPage component
- [x] 5.3 MapPage composes: map island, peek-card island, language switcher, empty-state overlay
- [x] 5.4 Wire `getAllCompanies()` results into MapPage and pass to islands as props

## 6. Map widget (interactive island)

- [x] 6.1 Implement `<MapView>` React island wrapping `mapbox-gl`, hydrated `client:only`
- [x] 6.2 Fail the build if `MAPBOX_PUBLIC_TOKEN` is missing — no silent fallback style
- [x] 6.3 Auto-fit bounds to all pin coordinates on cold load
- [x] 6.4 When `?selected` resolves to a known company, center the initial viewport on that company instead of auto-fitting

## 7. Pin rendering

- [x] 7.1 Keep `computeAggregate(scores)` — integer mean of non-null axis scores, or `null` if all axes are null (for peek card / logic)
- [x] 7.2 Implement uniform style configuration for all pins
- [x] 7.3 Render pins with uniform size, color, and halo using design tokens (ink/black palette, no blur)

## 8. Selection and URL state

- [x] 8.1 On mount, read `?selected` from `window.location.search` and reflect it into local selection state
- [x] 8.2 Clicking a pin sets selection and pushes history with updated `?selected`
- [x] 8.3 Clicking the currently-selected pin, clicking map background, or pressing Escape clears selection and removes `?selected`
- [x] 8.4 When `?selected` resolves to an unknown id, strip the param without opening a peek card

## 9. Peek card

- [x] 9.1 `<PeekCard>` React component: bottom-anchored, paper-warm background, renders heading (name), locality (address.city), tagline (localized with fallback)
- [x] 9.2 `<Pentagon>` component renders the 5 axes in fixed order — `substance, ecology, power, embeddedness, posture` — with null-state styling distinct from low-score
- [x] 9.3 Primary CTA links to `/<slug>/` on nl and `/en/<slug>/` on en, preserving locale
- [x] 9.4 Inert bookmark button: visible, focusable, no behaviour (placeholder for a later change)

## 10. Language switcher

- [x] 10.1 `<LanguageSwitcher>` computes the opposite-locale URL while preserving `?selected` and any path tail
- [x] 10.2 Switcher label respects current locale ("english" on nl pages, "nederlands" on en pages)

## 11. Stub detail route

- [x] 11.1 `src/pages/[slug].astro` renders a placeholder "coming soon" page using the company name resolved via `getCompanyById`
- [x] 11.2 `src/pages/en/[slug].astro` mirrors it in english
- [x] 11.3 `getStaticPaths()` for both is fed by `getAllCompanies()` so every renderable company has a navigable stub

## 12. Unit tests — company-data (vitest)

Each test name maps 1:1 to a `#### Scenario:` in `specs/company-data/spec.md`.

- [x] 12.1 `valid record is exposed to the app`
- [x] 12.2 `record missing a required field is dropped`
- [x] 12.3 `null score is preserved, not coerced`
- [x] 12.4 `invalid coordinates exclude the record`
- [x] 12.5 `non-ok records do not reach consumers`
- [x] 12.6 `score values are not duplicated in locale blocks` (assert parsed record has no `score` or `evidence` under `nl`/`en`)
- [x] 12.7 `missing translation falls back`
- [x] 12.8 `collection accessor returns only renderable companies`
- [x] 12.9 `lookup by id resolves to a record or undefined`

## 13. Browser tests — map-overview (Playwright)

Each test name maps 1:1 to a `#### Scenario:` in `specs/map-overview/spec.md`. Tests run against `npm run preview` with a deterministic mock data fixture.

- [x] 13.1 `dutch route at root`
- [x] 13.2 `english route under /en/`
- [x] 13.3 `auto-fit on cold load`
- [x] 13.4 `deep-link initial viewport`
- [x] 13.5 `each renderable company has exactly one pin`
- [x] 13.6 `aggregate score determines tier`
- [x] 13.7 `all-null company renders at the faintest tier and stays tappable`
- [x] 13.8 `selecting a pin updates the URL and opens the peek card`
- [x] 13.9 `deep-link opens peek card on first paint`
- [x] 13.10 `unknown selection is ignored`
- [x] 13.11 `clearing selection` (covers tap-selected-pin, tap-map-background, and Escape)
- [x] 13.12 `peek card renders current-locale prose`
- [x] 13.13 `pentagon renders all five axes including nulls`
- [x] 13.14 `CTA preserves locale and uses the company slug`
- [x] 13.15 `switcher preserves selection across locales`
- [x] 13.16 `switcher toggles back to default`
- [x] 13.17 `empty collection still renders the map` (run with an empty-data fixture)

## 14. Build and verification

- [x] 14.1 `npm run build` succeeds with mock data and a valid `MAPBOX_PUBLIC_TOKEN`
- [x] 14.2 `npm run build` fails with a clear error when `MAPBOX_PUBLIC_TOKEN` is unset
- [x] 14.3 `npm run preview` and manual smoke: load `/`, click a pin, verify `?selected`, switch language, follow the CTA into the stub detail
- [x] 14.4 Full Playwright suite passes against `npm run preview`
- [x] 14.5 Verify all user-visible copy is lowercase except mono utility marks (per design-system rule)
