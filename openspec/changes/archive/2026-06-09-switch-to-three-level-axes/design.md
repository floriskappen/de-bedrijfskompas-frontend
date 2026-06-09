## Context

Axis scores arrive from the pipeline as integers `0–100` (or `null`). Today the frontend exposes them directly: the filter sheet uses a 0–90 numeric minimum slider over ten histogram buckets (`filters.ts`), and the detail page surfaces the per-axis *evidence* label on the collapsed row. The numbers read as grades, but the axes measure how much focus a company puts on a theme. This change adds a frontend-only "focus level" projection over the existing scores and reworks the filter and detail UIs around it. The data contract is untouched.

## Goals / Non-Goals

**Goals:**
- One shared score→level projection consumed by filters, the detail page, and (conceptually) the pentagon.
- A filter sheet that reads as a list of axes with level sliders, not a stack of cards.
- Consistent level vocabulary between filters and detail.

**Non-Goals:**
- Changing the pipeline data contract or the stored 0–100 scores.
- Building favorites (only a placeholder lands here).
- Redrawing the pentagon — its rings already sit at the band thresholds; visual restyling is optional polish, not required.

## Decisions

**Levels are a derived projection, not new data.** A small helper (`getFocusLevel(score)`) lives beside `filters.ts` under `src/lib/company-data/`. Scores stay 0–100 everywhere they're stored or composed (e.g. the composite badge mean is unchanged). Alternative — baking levels into the data layer — was rejected: it would leak a presentation choice into the contract and lose the underlying number the pentagon still plots.

**Thresholds at 33 and 66, reusing the pentagon rings.** `Pentagon.tsx` already draws rings at fractional radii `0.33 / 0.66 / 1.0`. Binding the level boundaries to those exact radii means a plotted dot visibly lands inside its named band — the radar and the filters explain each other for free. This is the answer to "how should the pentagon correspond to the levels": it already does; we just name the bands. Boundaries are half-open upward: `low = [0,33)`, `medium = [33,66)`, `high = [66,100]`.

**Slider has four stops: `none` (geen voorkeur) + the three levels.** This resolves the explore-phase open question (3 vs 4 stops) in favour of 4. It maps cleanly onto today's semantics — the old "minimum 0 = include nulls, minimum >0 = exclude nulls" becomes "`none` includes nulls, `low` and up exclude nulls". The lowest *level* stop (`low`) therefore carries real meaning: "must have a signal at all." `AxisMinimums` changes from `Record<AxisId, number>` to `Record<AxisId, FocusLevel | 'none'>` (or an ordinal index 0–3); `matchesAxisMinimum` compares level ordinals instead of numeric `>=`.

**Histogram collapses to three level buckets, no-signal bucket kept.** `getHistogramBuckets` returns the `none` (unknown) bucket plus `low/medium/high`, replacing the ten numeric buckets. The existing stable-max bar-height rule and facet-exclusion counting are preserved.

**Detail row swaps level for evidence; evidence moves inside.** The collapsed `AxisRow` shows the focus-level label where it currently renders `getEvidenceLabel` + `MoonGlyph` (`CompanyDetail.tsx:160`). No-signal axes keep "geen signaal" there. The evidence label + moon glyph relocate into the expanded panel, above or beside the reason prose, since evidence is the less important detail.

**`from=filters` back-nav sentinel.** `getAxisInfoHref` gains a variant that emits `?from=filters` (today it only takes a `fromCompanyId`). `AxisInfo.astro` already special-cases `from`; it learns that `filters` means "back to the map" instead of `/<from>/`. `MapView` reads a signal on arrival (a URL param such as `?filters=open`, set by the back link) and opens the sheet on mount. Alternative — encoding the open-sheet state in history — was rejected as heavier than a one-shot query flag.

## Risks / Trade-offs

- **Final level labels are unsettled** → they must convey *focus magnitude*, never quality. Provisional candidates (Dutch / English): `weinig focus / minder focus`, `gemiddeld / deels`, `veel focus / sterk`. Captured as an Open Question; copy lives in `src/lib/i18n` and is easy to swap without touching logic.
- **Coarser filtering loses precision** → intentional; the 0–100 numbers overstated the data's accuracy. The pentagon still shows the exact dot for anyone who wants nuance.
- **Boundary scores feel arbitrary** (e.g. 65 vs 66) → unavoidable with any bucketing; tying boundaries to the visible rings makes the cut legible rather than hidden.
- **`AxisMinimums` type change ripples** → `filters.test.ts`, the `setTestFilters` test hook in `MapView.tsx`, and any Playwright filter tests must move off numeric minimums.

## Open Questions

- **Final level labels** (the big one) — see candidates above; needs the user's wording, and it should read well both as a filter slider stop and as a detail-row tag.
- **Pentagon polish** — do we tint or label the three ring bands to reinforce the levels, or leave the rings as-is? Out of scope to *require*, open as a nice-to-have.
- **Favorites placeholder affordance** — chip in the work-field row, or its own labelled control? Resolve when favorites ships; keep it visually obviously inert until then.
