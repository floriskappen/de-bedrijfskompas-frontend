## 1. Focus-level projection (capability: axis-focus-levels)

- [x] 1.1 Add `FocusLevel` type (`'low' | 'medium' | 'high' | 'none'`) and `getFocusLevel(score: number | null): FocusLevel` beside `src/lib/company-data/filters.ts`, with thresholds `low=[0,33)`, `medium=[33,66)`, `high=[66,100]`, `null→none`.
- [x] 1.2 Add localized, lowercase level labels to `src/lib/i18n` (nl + en) reusing the existing "geen signaal" wording for `none`; expose a `getFocusLevelLabel(level, locale)`.
- [x] 1.3 Unit tests `getFocusLevel maps scores to bands` and `getFocusLevel maps null to none` (covers scenarios "Score maps to its band", "Null score is its own level").
- [x] 1.4 Unit test `focus level thresholds match pentagon ring radii` asserting the boundaries equal the `0.33`/`0.66` radii used in `Pentagon.tsx` (covers "Band thresholds match pentagon rings").
- [x] 1.5 Unit test `getFocusLevelLabel returns localized lowercase labels` for nl/en across all four levels (covers "Level renders a localized label", "No-signal level reads as unknown").

## 2. Filter model (capability: map-overview — Map filtering)

- [x] 2.1 Change `AxisMinimums` in `filters.ts` to a per-axis minimum level (`FocusLevel | 'none'`, or ordinal 0–3); update `DEFAULT_AXIS_MINIMUMS`/`EMPTY_FILTERS` to `none`.
- [x] 2.2 Rewrite `matchesAxisMinimum` to compare level ordinals: `none` includes nulls; `low`+ require a numeric score; `medium`/`high` require that band or above.
- [x] 2.3 Update `hasActiveFilters` and the active-filter count to treat `none` as inactive.
- [x] 2.4 Replace `getHistogramBuckets` with three level buckets (`low/medium/high`) plus the leading `none` (unknown) bucket; keep stable-max scaling and facet-exclusion counting.
- [x] 2.5 Update `src/lib/company-data/filters.test.ts` for the new model: tests `none keeps null scores`, `low excludes only nulls`, `high excludes lower bands`, `buckets aggregate by focus level`, `distribution keeps a no-signal bucket` (covers Map filtering + Filter distributions scenarios).

## 3. Filter sheet UI (capability: map-overview — Filter panel & distributions)

- [x] 3.1 In `MapView.tsx`, replace the per-axis `ontwerp-card` block (~lines 838–900) with an axis header row: `AxisGlyph` + localized label + a question-mark icon linking to `getAxisInfoHref(axis, locale, 'filters')`; controls sit beneath, not in a card.
- [x] 3.2 Render the 3-bucket level distribution + a 4-stop level slider (`none/low/medium/high`); de-emphasize buckets below the selected minimum; exclude the `none` bucket from the slider track.
- [x] 3.3 Update `updateAxisMinimum`, `resetFilters`, and the `setTestFilters` test hook for level values.
- [x] 3.4 Add a non-functional favorites filter placeholder to the sheet, visibly inert (no effect on the company set).
- [x] 3.5 On map mount, read a one-shot `?filters=open` (or equivalent) signal and open the filter sheet; strip the param afterward.
- [x] 3.6 Playwright in `tests/map-overview.spec.ts`: `axis row question mark links to axis info page`, `favorites placeholder is inert`, `level slider filters companies by minimum level`, `reset returns all minimums to none` (covers Filter panel scenarios). Use real browser checks for the lowercase/no-card visual constraints.

## 4. Detail page (capability: company-detail — Axis reasoning list)

- [x] 4.1 In `CompanyDetail.tsx` `AxisRow`, replace the collapsed-row evidence label (~line 160) with the focus-level label; show "geen signaal" for `null`/`no_signal` and keep the row de-emphasized.
- [x] 4.2 Move the evidence label + `MoonGlyph` into the expanded panel (alongside/above the reason prose); omit it cleanly when there is no reason and no evidence to show.
- [x] 4.3 Playwright in `tests/company-detail.spec.ts`: `collapsed axis row shows focus level`, `no-signal axis shows geen signaal on the row`, `expanded row shows evidence inside the panel` (covers Axis reasoning list scenarios).

## 5. Axis info back-nav (capability: axis-info-pages — Origin-aware back navigation)

- [x] 5.1 Extend `getAxisInfoHref` in `src/lib/company-data/axis-detail.ts` to accept the reserved `from='filters'` origin and emit `?from=filters`.
- [x] 5.2 In `AxisInfo.astro`, handle `from=filters`: back control points to the map for the locale with the `?filters=open` signal (rather than `/<from>/`).
- [x] 5.3 Test `getAxisInfoHref encodes from=filters` (unit) and Playwright `axis info back from filters returns to map with sheet open` (covers "Back to the filters"); keep existing `from=<company_id>` and no-`from` paths green.

## 6. Cleanup & verification

- [x] 6.1 Remove dead numeric-minimum code paths and stale histogram bucket types/labels.
- [x] 6.2 Run `vitest` and the Playwright suites; confirm all scenario-mapped tests pass and no lowercase/single-accent visual regressions in the reworked sheet.
- [x] 6.3 Tick the four TODO.md "Filters page" items (lines 24–27) and the related General item (line 56) as the detail-page level wording lands.

## 7. Design rework (post-implementation polish)

- [x] 7.1 Add a shared `FocusMeter` (three-bar glyph; filled count = level, hollow = no signal) and extract a shared `AxisGlyph` from the duplicated per-component definitions.
- [x] 7.2 Detail page: replace the collapsed-row level *text* with the focus meter (no-signal → hollow meter); keep `data-axis-level` + an accessible level label.
- [x] 7.3 Filter sheet: move the "?" to a small utility link right after the axis label (no longer an icon button); show the selected minimum on the trailing edge as a `≥`-prefixed focus meter, or "geen voorkeur" when unset.
- [x] 7.4 Filter sheet: replace the histogram + native slider with a four-column level strip (`none`/`low`/`medium`/`high`) whose columns align 1:1 with the bars; pointer click/drag sets the minimum at each column edge; included columns carry an accent rule; keep a visually hidden range input for keyboard/AT and tests.
- [x] 7.5 Add `getFocusMinimumLabel` ("minstens … focus" / "at least … focus", "geen voorkeur"/"any") for the at-least readout's accessible name.
- [x] 7.6 Update Playwright assertions (detail level slot, filter minimum readout, distribution bar selector, none-column reset) and record the rework in `.design/DESIGN.md`.
