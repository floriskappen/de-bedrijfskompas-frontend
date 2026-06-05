## 1. Detail island component

- [x] 1.1 Create `src/components/CompanyDetail.tsx` (client island) taking `{ company, locale }`.
- [x] 1.2 Port the peek-card identity header verbatim: favicon thumbnail with monogram fallback (reuse the `faviconFailed` pattern), name, `city · optional km` line, plain tagline paragraph via `getLocalizedField`.
- [x] 1.3 Render `<Pentagon scores={company.scores} locale={locale} />` at the top of the card.
- [x] 1.4 Build the tappable axis list over `AXIS_IDS` in fixed order, using `getAxisLabel` for names; each row shows the axis glyph + label + evidence glyph/word + chevron, and expands on tap to reveal evidence + localized `reason`.
- [x] 1.5 Add the per-axis evidence treatment (moon glyph + lowercase word) mapping `well_evidenced`/`partial`/`no_signal`; de-emphasize `no_signal` / null-score rows.
- [x] 1.6 In each expanded row, add the axis info-page link → `/as/{axisId}/` (nl) or `/en/axis/{axisId}/` (en); hide the prose block when `reason` is empty in both locales.
- [x] 1.7 Add the company website link (only when `company.website` is present).

## 2. Routes & i18n

- [x] 2.1 Replace `src/pages/[slug].astro` placeholder: keep `getStaticPaths` + unknown→404 redirect, mount `CompanyDetail` with `client:load` and `locale="nl"`, set the page title.
- [x] 2.2 Mirror the same in `src/pages/en/[slug].astro` with `locale="en"`.
- [x] 2.3 Add any new chrome copy (e.g. axis-list hint, "wat betekent …?", website link label, evidence words) to `src/lib/i18n/messages.ts` for both locales, lowercase.

## 3. Tests

- [x] 3.1 Unit (vitest): evidence→label/glyph mapping helper covers all three `EvidenceLevel` values incl. `no_signal` (`maps each evidence level`).
- [x] 3.2 Unit (vitest): the nl/en axis info-link URL builder returns `/as/{axisId}/` and `/en/axis/{axisId}/` for every axis ID (`builds axis info-page links per locale`).
- [x] 3.3 E2e (Playwright): Dutch detail page renders identity header, pentagon, and five axis rows with site labels (`nl detail page shows header pentagon and axes`).
- [x] 3.4 E2e (Playwright): tapping an axis row expands it and reveals the `reason` text and the axis info link (`expanding an axis reveals reason and info link`).
- [x] 3.5 E2e (Playwright): a company with a `null`-score axis shows the de-emphasized no-signal row and a `?` in the pentagon (`null-score axis renders no-signal state`).
- [x] 3.6 E2e (Playwright): the website link is present and points at `company.website`, and the English route renders in English (`website link and en locale`).

## 4. Verify

- [x] 4.1 Run `npm run test` and `npm run test:e2e`; build with `npm run build` and spot-check a detail page in `npm run preview` for lowercase copy, single accent, no blur.
