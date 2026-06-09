## Why

The numeric 0–100 axis scores read as a grade, but the axes measure *how much focus* a company puts on a theme, not how "good" it is. A 0–90 minimum slider with ten histogram buckets is finicky to filter and invites a precision the data does not have. Collapsing each axis into three named focus levels — split at the two thresholds the pentagon already draws (33 and 66) — makes filtering intuitive ("include everything from this level up") and unifies the language across the map, the filters, and the detail page.

## What Changes

- Introduce a shared **focus-level** projection: each numeric axis score maps to one of three named bands (0–33 / 33–66 / 66–100), with `null` kept as a distinct "no signal" state. Band thresholds match the pentagon's existing rings.
- **BREAKING (filter model):** axis filters move from a numeric minimum (`0`–`90`, step 10) to a level minimum. The filter sheet drops the per-axis card; each axis becomes a header row (glyph + label + a small "?" utility link right after the label), with a four-column level strip (`none`/`low`/`medium`/`high`) whose columns align 1:1 with the distribution bars so clicking/dragging onto a column sets the minimum at that exact edge. The selected minimum reads as "at least this much focus" — shown as a `≥`-prefixed focus meter and a continuous accent rule under the included columns.
- Introduce a shared **focus meter** glyph (three bars; filled count = level) used as the focus-level indicator on the detail page rows, the favorites cards, and the filter sheet's selected minimum.
- **Detail page:** the collapsed axis row shows the axis's *focus level* as the focus meter where it currently shows the evidence label; "no signal" axes show the hollow meter and read "geen signaal". The evidence label ("goed/deels onderbouwd") moves into the expanded panel.
- **Axis info back-nav:** a "?" opened from the filter sheet returns to the map with the sheet reopened (a `from=filters` sentinel, distinct from the existing `from=<company_id>`).
- Final level labels are an open design decision (must convey focus, never good/bad); design.md proposes candidates.

## Capabilities

### New Capabilities
- `axis-focus-levels`: the shared score→level projection — band thresholds, the three level identifiers and their localized labels, no-signal handling, and the alignment to pentagon ring radii.

### Modified Capabilities
- `map-overview`: filter model, filter panel, and filter distributions move from numeric minimums to focus levels; adds the per-axis "?" info link, the aligned four-column level strip, and the at-least focus-meter readout.
- `company-detail`: the axis reasoning list surfaces the focus level on the collapsed row and relocates the evidence label into the expanded panel.
- `axis-info-pages`: origin-aware back navigation also accepts a `from=filters` origin that returns to the map with the filter sheet open.

## Impact

- Code: `src/lib/company-data/filters.ts` (+ `filters.test.ts`), `src/components/MapView.tsx`, `src/components/CompanyDetail.tsx`, `src/lib/company-data/axis-detail.ts`, `src/components/AxisInfo.astro`, and i18n copy in `src/lib/i18n/`. New level helpers under `src/lib/company-data/focus-level.ts`; shared `src/components/FocusMeter.tsx` and `src/components/AxisGlyph.tsx` (extracted from the duplicated per-component glyphs).
- Data contract: **unchanged** — the pipeline still emits 0–100 scores and evidence; focus levels are a frontend-only projection over them.
