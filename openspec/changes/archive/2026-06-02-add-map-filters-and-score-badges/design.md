## Context

The map route currently renders every renderable company as a uniform pin or cluster, with selection owned by `MapView` and peek-card display owned by a separate React island. The top-right filters pill is inert, and the language switcher occupies the other top-right slot.

The company data contract already carries five neutral score axes where `null` means no signal. The filter UI also needs `capability_tags` from the pipeline data; the local fixture may lag behind the release shape, so the frontend must tolerate missing tags while validating any tags that are present.

## Goals / Non-Goals

**Goals:**

- Show each unclustered company's composite score directly on the map.
- Keep composite scoring faithful to the data: average only available numeric scores.
- Replace inert filter chrome with a mobile-first bottom-sheet filter panel.
- Filter the visible map companies by axis minimums and selected tags.
- Expose score distributions and tag counts that update with active filters.
- Add a typed, validated tag taxonomy to the company data contract.

**Non-Goals:**

- Persist filter state in the URL.
- Redesign full company profile pages.
- Introduce a third-party charting, slider, icon, or state-management dependency.
- Solve desktop-specific advanced faceting beyond a usable responsive bottom sheet.

## Decisions

1. Keep filter state inside one map React island.

   `MapView` already owns marker generation, clustering, selection, and the Mapbox fallback. The filter panel and score badges should share the same filtered company list, so implementation should consolidate the filter button/panel and map marker filtering into the same client island or a small wrapper around it. Alternative: dispatch filter events between separate islands. That keeps existing Astro structure but creates avoidable synchronization and test complexity.

2. Composite score is a rounded mean over non-null axis scores.

   This preserves the meaning of `null` as unknown rather than bad. A company with `power: null` is judged on the axes where data exists; a company with all axes null renders `?`. Alternative: normalize by all five axes or impute zero. That would penalize missing evidence and contradict the data contract.

3. Axis filtering uses `0` as no preference and positive thresholds as hard minimums.

   This maps cleanly to the requested behavior: `0` includes known and unknown values, while `> 0` requires a numeric score at or above the threshold and therefore excludes unknowns for that axis. The slider can move in 5-point increments while histograms aggregate into 10 score buckets. Alternative: add a separate include-unknown toggle per axis. That is more explicit but too much surface area for the first mobile pass.

4. Facet counts are computed from the current filtered set excluding the facet being counted.

   Each score histogram should respect all active filters except its own axis threshold, and each tag count should respect all active filters except that tag's selected/unselected state. This gives useful "what would happen if I change this" counts. Alternative: counts over the raw dataset are simpler but become misleading once filters are active.

5. Capability tags are validated from a fixed frontend taxonomy and missing tags mean an empty tag list.

   The pipeline emits `capability_tags` objects with `family` and `prominence`. The frontend filters by `family` and keeps `prominence` available for future display. Missing `capability_tags` remains valid during transition and behaves as `[]`; unknown families or prominence values produce a build warning/drop according to the existing validation style once the field is present. Alternative: allow arbitrary tags from the pipeline. That would make icons/order/i18n unstable.

6. Axis sliders are aligned to numeric histogram buckets and exclude the unknown bucket.

   The histogram has a separate unknown bucket plus ten numeric buckets. The slider track should sit only under the numeric buckets, not under the unknown bucket, so a thumb at the "50" position means `>=50`. The slider uses bucket-aligned steps `0, 10, ..., 90`. Alternative: put the slider under the whole histogram including `?`; that caused the visible misalignment.

6. Icons are inline local SVG glyphs.

   The tag taxonomy has a fixed set of 19 IDs. Inline SVG keeps the system dependency-free, inherits the design-system colors, and is easy to test. Alternative: emoji or external icon packages. Emoji is visually inconsistent; packages add unnecessary dependency and styling surface.

## Risks / Trade-offs

- Data mismatch during transition → Treat missing `capability_tags` as empty and validate present tags strictly.
- Dense mobile panel → Keep sections compact, collapse visual complexity into histograms and chips, and provide a clear reset control.
- Map marker clutter from score badges → Use compact badges, keep clustering behavior, and preserve rosette offsets for collocated companies.
- Facet counts can be expensive later → Current dataset is small; keep count computation pure and memoized so it can be optimized if data grows.
- Removing the language switcher reduces locale discoverability → This is accepted for now; route-level locale support remains intact and the switcher can return in another chrome location later.
