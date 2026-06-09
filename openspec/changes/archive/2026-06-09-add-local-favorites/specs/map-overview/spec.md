## MODIFIED Requirements

### Requirement: Map filtering

The map SHALL filter visible companies by active axis minimums, selected work fields, and an optional favorites-only toggle. Each axis filter has a focus-level minimum. A minimum of `none` means no preference and MUST include companies with `null` for that axis, while `low`, `medium`, and `high` require a numeric signal at that focus level or higher. Selected work fields MUST combine with AND semantics: a company matches only when its ISCO minor-code projections include every selected work field. When favorites-only is active, a company MUST also be present in the visitor's locally stored favorite ids. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter except when the currently selected company no longer matches the active filters.

#### Scenario: Favorites-only shows saved companies

- **WHEN** the visitor has saved one company as a favorite
- **AND** enables the favorites-only filter
- **THEN** only otherwise matching favorite companies remain visible

#### Scenario: Favorites-only composes with other filters

- **WHEN** favorites-only is active
- **AND** the visitor also selects an axis minimum or work-field filter
- **THEN** only favorite companies matching those additional filters remain visible

#### Scenario: Unfavoriting hidden selection clears peek card

- **WHEN** favorites-only is active and the selected company is visible only because it is saved
- **AND** the visitor removes that company from favorites
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain a favorites-only toggle, per-axis focus-level controls, focus-level distribution histograms, work-field chips with counts, and a reset affordance. The favorites-only toggle SHALL be presented as a switch at the top of the panel — above the axis controls — rather than as a tag/chip among the work-field chips, carrying its localized label, the matching favorite count, and a sliding on/off state. The toggle SHALL be enabled when the browser supports local storage, SHALL show selected state (`aria-pressed`) when active, and SHALL not remove saved favorites when reset clears filters. The filter panel SHALL NOT itself link to the favorites overview page; the overview is reached from the map chrome favorites button. Axis and work-field labels SHALL be localized to the active locale, while ISCO codes and work-field identifiers remain locale-neutral.

#### Scenario: Favorites switch counts as active

- **WHEN** the visitor enables the favorites-only switch
- **THEN** the filters button active count increases by one

#### Scenario: Favorites switch sits above the axes

- **WHEN** the filter panel renders
- **THEN** the favorites-only switch appears at the top of the panel, above the per-axis level controls, and the panel offers no separate favorites-overview link

#### Scenario: Reset preserves saved favorites

- **WHEN** favorites-only is active and the visitor activates reset
- **THEN** favorites-only becomes inactive
- **AND** saved favorite companies remain saved

### Requirement: Filter distributions and counts

Each axis filter SHALL show a leftmost no-signal bucket for `null` scores and focus-level buckets for low, medium, and high. Axis histogram counts MAY update against the current filter combination while excluding the axis currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another bucket visually grow. Work-field chips and the favorites-only toggle SHALL show counts that update against the current filter combination while excluding the facet currently being counted.

#### Scenario: Favorites count respects other filters

- **WHEN** the visitor selects a work-field or axis filter
- **THEN** the favorites-only toggle count shows saved companies matching those other active filters

#### Scenario: Other facet counts respect favorites-only

- **WHEN** favorites-only is active
- **THEN** axis histograms and work-field chip counts are calculated from favorite companies that match the other active filters

### Requirement: Peek card content

When a company is selected, a peek card MUST overlay the bottom of the map showing, in order, a pentagon of all five axis scores, the company's identity, and its tagline in the current locale as plain inline text. The identity tile SHALL render the company's favicon when `favicon_url` is present and loads successfully, and SHALL fall back to a square ink monogram tile when `favicon_url` is absent or the favicon image fails to load. The card's top-right corner SHALL carry two icon buttons: a favorite toggle and an explicit close button that clears the selection. The whole card SHALL be the primary affordance: a tap or Enter/Space when focused opens the company's detail route, and the whole card SHALL be the drag surface.

#### Scenario: Favorite toggle does not open detail page

- **WHEN** a visitor activates the peek-card favorite toggle
- **THEN** the selected company favorite state changes
- **AND** the peek card remains open
- **AND** the visitor is not navigated to the detail page

### Requirement: Map chrome

The map experience MUST surface icon-only chrome controls anchored above the basemap for filters, project context, and the favorites overview. These controls SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel. Activating the project-context button SHALL navigate to the philosophy page (`/over/` for Dutch, `/en/about/` for English). Activating the favorites button SHALL navigate to the favorites overview page (`/favorieten/` for Dutch, `/en/favorites/` for English).

#### Scenario: Favorites chrome button opens overview

- **WHEN** a visitor activates the map favorites button
- **THEN** they are taken to the localized favorites overview page

## ADDED Requirements

### Requirement: Saved-company map marker

A company's map marker SHALL carry a small favorite mark (an accent star pinned to the top-right of its score tag) when that company is in the visitor's locally stored favorites, and SHALL omit the mark otherwise. The mark SHALL update live as favorites change — without a page reload — and applies to both the interactive (Mapbox) markers and the non-WebGL fallback markers.

#### Scenario: Saved company shows a favorite mark

- **WHEN** a company is saved as a favorite and its marker is visible on the map
- **THEN** its marker shows the favorite mark on the top-right of the score tag

#### Scenario: Favorite mark clears when unsaved

- **WHEN** the visitor removes a visible company from favorites
- **THEN** that company's marker drops the favorite mark without a page reload
