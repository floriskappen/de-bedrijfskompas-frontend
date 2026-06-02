## ADDED Requirements

### Requirement: Composite score badges

Each unclustered company pin SHALL render a compact composite-score badge instead of a uniform dot. The badge SHALL visually distinguish score badges from cluster markers by pairing the score with a small score glyph. The composite score SHALL be the rounded arithmetic mean of that company's available numeric axis scores; `null` scores MUST be ignored rather than counted as zero. If a company has no numeric axis scores, the badge SHALL render a distinct unknown marker. The badge MUST remain tappable, preserve selection behavior, and keep deterministic rosette offsets for collocated companies.

#### Scenario: Composite score ignores unknown axes

- **WHEN** a company has numeric scores `70`, `55`, `40`, and `50`, plus `power.score: null`
- **THEN** its unclustered pin badge displays `54`

#### Scenario: All-null scores display unknown badge

- **WHEN** a company has every axis `score: null` and is not clustered
- **THEN** its badge displays the unknown marker and still opens the peek card on tap

#### Scenario: Collocated score badges fan out

- **WHEN** two or more score-badge pins share the same `latlng` and are not clustered
- **THEN** each badge is offset on a small deterministic rosette so every badge stays visible and tappable

#### Scenario: Score badges are distinct from cluster markers

- **WHEN** a cluster expands into individual score-badge pins
- **THEN** the individual badges include a score glyph so their numbers are not presented with the same visual language as cluster counts

### Requirement: Map filtering

The map SHALL filter visible companies by active axis minimums and selected tags. Each axis filter has a minimum in `[0, 100]`; a minimum of `0` means no preference and MUST include companies with `null` for that axis, while any minimum above `0` MUST require a numeric score greater than or equal to that minimum. Selected tags MUST combine with AND semantics: a company matches only when it contains every selected tag. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter.

#### Scenario: Axis minimum keeps unknowns at zero

- **WHEN** the power minimum is `0`
- **THEN** companies with `scores.power.score: null` remain visible unless excluded by another active filter

#### Scenario: Axis minimum excludes unknowns above zero

- **WHEN** the power minimum is `5`
- **THEN** companies with `scores.power.score: null` are hidden from markers and clusters

#### Scenario: Tag filters combine with AND semantics

- **WHEN** `software-engineering` and `commercial` are both selected
- **THEN** only companies containing both tags remain visible

#### Scenario: Filtering clears hidden selection

- **WHEN** the currently selected company no longer matches the active filters
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain per-axis minimum sliders, score distribution histograms, tag chips with counts, and a reset affordance. Axis minimum sliders SHALL sit under the numeric histogram buckets and MUST NOT include the unknown bucket in the slider track. If the current company data contains no tags, the tag section SHALL show a quiet no-tags message instead of zero-count chips. The panel MUST be operable on mobile viewports and MUST respect reduced-motion preferences by opening directly without stepped motion. When a peek card is open, the filter panel SHALL render above both the peek card and the map markers. The panel's header controls (reset and close) SHALL remain visible and operable while the panel body scrolls, and SHALL share a common height. The panel header SHALL also be draggable downward to dismiss the panel. Axis and tag chip labels SHALL be localized to the active locale, while tag identifiers remain locale-neutral.

#### Scenario: Icon-only filter button opens panel

- **WHEN** a user taps the top-right filters icon
- **THEN** the bottom-sheet filter panel opens without navigating or changing locale

#### Scenario: Reset clears active filters

- **WHEN** active score or tag filters exist and the user activates reset
- **THEN** all axis minimums return to `0`, all tags are deselected, and every otherwise renderable company is visible

#### Scenario: Active filters are counted on button

- **WHEN** one axis minimum and one tag filter are active
- **THEN** the filters button shows an active count of `2`

#### Scenario: No tags data shows empty tag section

- **WHEN** the current company data contains no tag values
- **THEN** the tag section shows that there are no tags in the current data and does not render zero-count tag chips

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
- **THEN** the panel appears directly in its open state without stepped slide motion

### Requirement: Filter distributions and counts

Each score filter SHALL show a leftmost unknown bucket for `null` scores and ten numeric histogram buckets covering `0-9`, `10-19`, `20-29`, `30-39`, `40-49`, `50-59`, `60-69`, `70-79`, `80-89`, and `90-100`. Numeric sliders MUST map directly to bucket starts `0`, `10`, `20`, `30`, `40`, `50`, `60`, `70`, `80`, and `90`; setting the slider to `50` means a minimum score of `50`. Histogram counts MAY update against the current filter combination while excluding the facet currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another bucket visually grow. Tag chips SHALL show a count and MUST update against the current filter combination while excluding the tag currently being counted.

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

- **WHEN** a user selects `commercial`
- **THEN** score histograms and other tag counts update to show counts for companies matching `commercial`

#### Scenario: Histogram bars do not grow while filtering

- **WHEN** a user raises an axis minimum that removes companies from the visible set
- **THEN** buckets in other score histograms may shrink or stay the same height, but they do not grow taller

## MODIFIED Requirements

### Requirement: Pin rendering

Every renderable company that matches the active filters MUST appear as either its own score-badge pin or be part of a cluster at its coordinates. At lower zoom levels, pins that are close to each other MUST be grouped into dynamic clusters. A cluster marker SHALL render in a distinct style, displaying the count of matching companies inside it. Clicking on a cluster marker MUST zoom the map to a level where the cluster expands into sub-clusters or individual score-badge pins. Companies whose axis scores are all `null` MUST still render an unknown badge and remain tappable when they match the active filters. The currently-selected pin SHALL carry an additional red halo ring. When two or more matching companies share the same `latlng` and are not clustered, their badges MUST fan out on a small, deterministic pixel-space rosette around the shared point so each badge stays individually visible and tappable regardless of how many are collocated.

#### Scenario: Every matching renderable company has one badge pin

- **WHEN** the map finishes rendering, no filters are active, and zoom level is maximum
- **THEN** every renderable company has exactly one score-badge pin or unknown badge pin

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null`, matches the active filters, and is not clustered
- **THEN** its unknown badge opens the peek card on tap

#### Scenario: Collocated companies fan out

- **WHEN** two or more matching companies share the same `latlng` and are not clustered
- **THEN** each badge is offset on a small rosette around the shared point so the badges do not overlap and every one can be tapped individually

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a score-badge pin is the currently-selected pin and is not clustered
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

#### Scenario: Dynamic clustering based on zoom

- **WHEN** the map zoom is low enough that two or more matching pins are close to each other
- **THEN** they are replaced by a cluster marker showing the count of matching companies in that cluster

#### Scenario: Clicking a cluster zooms in

- **WHEN** a user clicks on a cluster marker
- **THEN** the map zooms and centers on that cluster, expanding it to reveal its contents

### Requirement: Map chrome

The map experience MUST surface an icon-only filters button anchored top-right above the basemap. The control SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and mono-accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel.

#### Scenario: Filters button opens panel

- **WHEN** a user taps the filters button
- **THEN** the filter panel opens and the URL does not change

## REMOVED Requirements

### Requirement: Language switcher

**Reason**: The map chrome should be simplified for the mobile-first filter pass, and locale switching will move to a different location later.

**Migration**: The `/` and `/en/` routes continue to exist and preserve localized content. Remove the map page's top-right language switcher and its route-toggle behavior from this capability until a new locale-switching location is specified.
