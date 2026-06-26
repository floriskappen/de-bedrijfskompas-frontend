## MODIFIED Requirements

### Requirement: Map chrome

The map experience MUST surface icon-only chrome controls anchored above the basemap for filters, project context, the favorites overview, and the browser-local LLM connection-management surface. These controls SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel. Activating the project-context button SHALL navigate to the philosophy page (`/over/` for Dutch, `/en/about/` for English). Activating the favorites button SHALL navigate to the favorites overview page (`/favorieten/` for Dutch, `/en/favorites/` for English). Activating the connection-management button SHALL open the connection-management surface when a confirmed browser-local LLM configuration exists, and SHALL open the first-run setup when no confirmed configuration exists. The Ikigai matching entry SHALL NOT be a map chrome control; it SHALL be reached from the filter panel.

#### Scenario: Favorites chrome button opens overview

- **WHEN** a visitor activates the map favorites button
- **THEN** they are taken to the localized favorites overview page

#### Scenario: Connection-management button opens the management surface

- **WHEN** a visitor with a saved key or a confirmed browser-local LLM session activates the map connection-management button
- **THEN** the connection-management surface opens

#### Scenario: Connection-management button opens first-run setup

- **WHEN** a visitor with no saved key and no confirmed browser-local LLM session activates the map connection-management button
- **THEN** the first-run setup opens instead of the management surface

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain a favorites-only toggle, an Ikigai matching entry presented as an advanced filter affordance, per-axis focus-level controls, focus-level distribution histograms, work-field chips with counts, and a reset affordance. The favorites-only toggle SHALL be presented as a switch at the top of the panel — above the axis controls — rather than as a tag/chip among the work-field chips, carrying its localized label, the matching favorite count, and a sliding on/off state. The toggle SHALL be enabled when the browser supports local storage, SHALL show selected state (`aria-pressed`) when active, and SHALL not remove saved favorites when reset clears filters. Activating the Ikigai entry SHALL close the filter panel and start the matching entry path, opening the bring-your-own-key setup when no confirmed browser-local LLM configuration is available and opening the Ikigai matching flow when a confirmed configuration is available. The filter panel SHALL NOT itself link to the favorites overview page; the overview is reached from the map chrome favorites button. Axis and work-field labels SHALL be localized to the active locale, while ISCO codes and work-field identifiers remain locale-neutral.

#### Scenario: Favorites switch counts as active

- **WHEN** the visitor enables the favorites-only switch
- **THEN** the filters button active count increases by one

#### Scenario: Favorites switch sits above the axes

- **WHEN** the filter panel renders
- **THEN** the favorites-only switch appears at the top of the panel, above the per-axis level controls, and the panel offers no separate favorites-overview link

#### Scenario: Ikigai entry opens the matching flow

- **WHEN** a visitor with a confirmed browser-local LLM configuration activates the Ikigai entry in the filter panel
- **THEN** the filter panel closes and the Ikigai matching flow opens

#### Scenario: Ikigai entry opens BYOK setup when unconfigured

- **WHEN** a visitor without a confirmed browser-local LLM configuration activates the Ikigai entry in the filter panel
- **THEN** the filter panel closes and the bring-your-own-key setup opens instead of running matching prompts

#### Scenario: Reset preserves saved favorites

- **WHEN** favorites-only is active and the visitor activates reset
- **THEN** favorites-only becomes inactive
- **AND** saved favorite companies remain saved
