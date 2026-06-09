## MODIFIED Requirements

### Requirement: Map filtering

The map SHALL filter visible companies by an active focus-level minimum per axis and by selected work fields. Each axis filter has a minimum level of `none` (no preference), `low`, `medium`, or `high`. A minimum of `none` means no preference and MUST include companies with a `null` score for that axis. Any minimum above `none` MUST require a numeric score, excluding `null` scores; `low` admits any numeric score, `medium` admits scores in the `medium` or `high` band, and `high` admits only scores in the `high` band. Selected work fields MUST combine with AND semantics: a company matches only when its ISCO minor-code projections include every selected work field. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter.

#### Scenario: No-preference keeps unknowns

- **WHEN** the power minimum is `none`
- **THEN** companies with `scores.power.score: null` remain visible unless excluded by another active filter

#### Scenario: Low minimum excludes only unknowns

- **WHEN** the power minimum is `low`
- **THEN** companies with a numeric power score remain visible and companies with `scores.power.score: null` are hidden from markers and clusters

#### Scenario: Higher minimum excludes lower bands

- **WHEN** the power minimum is `high`
- **THEN** only companies whose power score is in the `high` band (`>= 66`) remain visible, and companies in the `low` or `medium` band or with `null` are hidden

#### Scenario: Work-field filters combine with AND semantics

- **WHEN** `software-it` and `sales-commercial` are both selected
- **THEN** only companies whose projected work fields include both values remain visible

#### Scenario: Filtering clears hidden selection

- **WHEN** the currently selected company no longer matches the active filters
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL present each axis as a header row carrying the axis glyph and its localized label, with a small question-mark link — sized as a utility mark, not a button — placed immediately after the label so it reads as "what does this axis mean" and not as an action on the selected value. The header row SHALL also show the axis's selected minimum on its trailing edge as a compact focus meter (with a leading "≥" mark) so the selection reads as "at least this much focus", or as a neutral "no preference" mark when no minimum is set. The per-axis level control (a focus-level distribution combined with the minimum selector) sits beneath the row rather than inside a separate card per axis. The panel SHALL also present work-field chips with counts and a reset affordance. The level control SHALL be a four-column strip — `none`/`low`/`medium`/`high` — whose columns align one-to-one with the distribution bars, so that clicking or dragging onto a column sets the minimum to that level and the boundary at which the minimum changes coincides exactly with each bar's edge. The leftmost (`none`) column acts as the "any" / no-preference stop. A visually hidden range input mirrors the strip for keyboard and assistive-technology use. If the current company data contains no projected work fields, the work-field section SHALL show a quiet empty message instead of zero-count chips. The panel MUST be operable on mobile viewports and MUST respect reduced-motion preferences by opening directly without stepped motion. When a peek card is open, the filter panel SHALL render above both the peek card and the map markers. The panel's header controls (reset and close) SHALL remain visible and operable while the panel body scrolls, and SHALL share a common height. The panel header SHALL also be draggable downward to dismiss the panel. Axis and work-field chip labels SHALL be localized to the active locale, while ISCO codes and work-field identifiers remain locale-neutral.

#### Scenario: Icon-only filter button opens panel

- **WHEN** a user taps the top-right filters icon
- **THEN** the bottom-sheet filter panel opens without navigating or changing locale

#### Scenario: Axis row links to its info page

- **WHEN** a user activates the question-mark link that follows an axis label
- **THEN** they navigate to that axis's info page for the current locale

#### Scenario: Selected minimum reads as "at least"

- **WHEN** an axis minimum of `low` is active
- **THEN** the axis header shows the minimum as a focus meter prefixed with "≥", and the distribution columns from `low` upward read as included, so the selection reads as "at least little focus" rather than "only little focus"

#### Scenario: Level boundary aligns with bar edges

- **WHEN** a user drags across the level strip
- **THEN** the minimum changes exactly at each column boundary, so dragging past a bar's column deactivates it rather than leaving it selected

#### Scenario: The none column clears the minimum

- **WHEN** a user selects the leftmost (`none`) column of an axis level strip
- **THEN** that axis minimum returns to `none` (no preference) and the axis stops contributing to the active-filter count

#### Scenario: Reset clears active filters

- **WHEN** active level or work-field filters exist and the user activates reset
- **THEN** all axis minimums return to `none`, all work fields are deselected, and every otherwise renderable company is visible

#### Scenario: Active filters are counted on button

- **WHEN** one axis minimum above `none` and one work-field filter are active
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

Each axis filter SHALL show a leftmost no-signal column for `null` scores and three focus-level histogram columns — `low`, `medium`, and `high` — covering the score bands `[0, 33)`, `[33, 66)`, and `[66, 100]`. The level control MUST map directly to the minimum levels `none`, `low`, `medium`, and `high`; selecting `medium` means a minimum focus level of `medium`. Histogram counts MAY update against the current filter combination while excluding the facet currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another column visually grow. Columns at or above the selected minimum level SHALL read as included (carrying a continuous accent rule that reinforces the at-least range) while columns below it read as de-emphasized. Work-field chips SHALL show a count and MUST update against the current filter combination while excluding the work field currently being counted.

#### Scenario: Distribution includes a no-signal column

- **WHEN** an axis has companies with `score: null`
- **THEN** that axis distribution shows a no-signal column count to the left of the three level columns

#### Scenario: Buckets aggregate by focus level

- **WHEN** ecology scores include `20`, `50`, and `75`
- **THEN** the distribution counts them in the `low`, `medium`, and `high` buckets respectively

#### Scenario: Control threshold aligns with level column

- **WHEN** a user selects the `medium` column of an axis level strip
- **THEN** the active minimum for that axis is `medium`, so every visible company must have a numeric score in the `medium` or `high` band on that axis unless the minimum is reset to `none`

#### Scenario: Counts update with other active filters

- **WHEN** a user selects `sales-commercial`
- **THEN** level distributions and other work-field counts update to show counts for companies matching `sales-commercial`

#### Scenario: Distribution bars do not grow while filtering

- **WHEN** a user raises an axis minimum that removes companies from the visible set
- **THEN** buckets in other axis distributions may shrink or stay the same height, but they do not grow taller
