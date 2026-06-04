## MODIFIED Requirements

### Requirement: Map filtering

The map SHALL filter visible companies by active axis minimums and selected work fields. Each axis filter has a minimum in `[0, 100]`; a minimum of `0` means no preference and MUST include companies with `null` for that axis, while any minimum above `0` MUST require a numeric score greater than or equal to that minimum. Selected work fields MUST combine with AND semantics: a company matches only when its ISCO minor-code projections include every selected work field. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter.

#### Scenario: Axis minimum keeps unknowns at zero

- **WHEN** the power minimum is `0`
- **THEN** companies with `scores.power.score: null` remain visible unless excluded by another active filter

#### Scenario: Axis minimum excludes unknowns above zero

- **WHEN** the power minimum is `5`
- **THEN** companies with `scores.power.score: null` are hidden from markers and clusters

#### Scenario: Work-field filters combine with AND semantics

- **WHEN** `software-it` and `sales-commercial` are both selected
- **THEN** only companies whose projected work fields include both values remain visible

#### Scenario: Filtering clears hidden selection

- **WHEN** the currently selected company no longer matches the active filters
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain per-axis minimum sliders, score distribution histograms, work-field chips with counts, and a reset affordance. Axis minimum sliders SHALL sit under the numeric histogram buckets and MUST NOT include the unknown bucket in the slider track. If the current company data contains no projected work fields, the work-field section SHALL show a quiet empty message instead of zero-count chips. The panel MUST be operable on mobile viewports and MUST respect reduced-motion preferences by opening directly without stepped motion. When a peek card is open, the filter panel SHALL render above both the peek card and the map markers. The panel's header controls (reset and close) SHALL remain visible and operable while the panel body scrolls, and SHALL share a common height. The panel header SHALL also be draggable downward to dismiss the panel. Axis and work-field chip labels SHALL be localized to the active locale, while ISCO codes and work-field identifiers remain locale-neutral.

#### Scenario: Icon-only filter button opens panel

- **WHEN** a user taps the top-right filters icon
- **THEN** the bottom-sheet filter panel opens without navigating or changing locale

#### Scenario: Reset clears active filters

- **WHEN** active score or work-field filters exist and the user activates reset
- **THEN** all axis minimums return to `0`, all work fields are deselected, and every otherwise renderable company is visible

#### Scenario: Active filters are counted on button

- **WHEN** one axis minimum and one work-field filter are active
- **THEN** the filters button shows an active count of `2`

#### Scenario: No work-field data shows empty section

- **WHEN** the current company data contains no projected work-field values
- **THEN** the work-field section shows that there are no work fields in the current data and does not render zero-count chips

#### Scenario: Filter panel layers above an open peek card

- **WHEN** a peek card is open and the user opens the filter panel
- **THEN** the filter panel renders above the peek card and the map markers, not behind them

#### Scenario: Panel header stays reachable while scrolling

- **WHEN** the filter panel body is scrolled to its bottom
- **THEN** the reset and close controls remain visible and operable at the top of the panel

#### Scenario: Dragging the panel header dismisses the panel

- **WHEN** the user drags the filter panel header downward past the dismiss threshold
- **THEN** the filter panel closes

#### Scenario: Reduced motion skips panel animation

- **WHEN** a user whose system preference is reduced motion opens the filter panel
- **THEN** the panel appears directly in its open state without stepped motion

### Requirement: Filter distributions and counts

Each score filter SHALL show a leftmost unknown bucket for `null` scores and ten numeric histogram buckets covering `0-9`, `10-19`, `20-29`, `30-39`, `40-49`, `50-59`, `60-69`, `70-79`, `80-89`, and `90-100`. Numeric sliders MUST map directly to bucket starts `0`, `10`, `20`, `30`, `40`, `50`, `60`, `70`, `80`, and `90`; setting the slider to `50` means a minimum score of `50`. Histogram counts MAY update against the current filter combination while excluding the facet currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another bucket visually grow. Work-field chips SHALL show a count and MUST update against the current filter combination while excluding the work field currently being counted.

#### Scenario: Histogram includes unknown bucket

- **WHEN** an axis has companies with `score: null`
- **THEN** that axis histogram shows an unknown bucket count to the left of the numeric buckets

#### Scenario: Histogram buckets aggregate by tens

- **WHEN** ecology scores include `55`, `62`, and `75`
- **THEN** the histogram counts them in `50-59`, `60-69`, and `70-79`

#### Scenario: Slider threshold aligns with bucket label

- **WHEN** a user sets the slider thumb to the `50` position under a score histogram
- **THEN** the active minimum for that axis is `50`, so every visible company must have a numeric score greater than or equal to `50` on that axis unless the minimum is reset to `0`

#### Scenario: Counts update with other active filters

- **WHEN** a user selects `sales-commercial`
- **THEN** score histograms and other work-field counts update to show counts for companies matching `sales-commercial`

#### Scenario: Histogram bars do not grow while filtering

- **WHEN** a user raises an axis minimum that removes companies from the visible set
- **THEN** buckets in other score histograms may shrink or stay the same height, but they do not grow taller
