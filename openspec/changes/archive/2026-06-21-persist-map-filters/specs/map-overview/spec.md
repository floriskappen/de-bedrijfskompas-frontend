## ADDED Requirements

### Requirement: Persistent map filter state

The map overview SHALL persist its active axis minimums, selected work fields, and favorites-only setting in versioned browser-local storage until the visitor resets the filters or clears browser storage. Persisted map filters SHALL be shared by `/` and `/en/`, SHALL be restored before visible companies and `?selected` state are reconciled, and SHALL remain separate from favorites, BYOK, and Ikigai storage. Missing, malformed, partial, duplicated, or obsolete values MUST be normalized to supported filter values without making the map unusable.

#### Scenario: Filters survive a reload

- **WHEN** a visitor selects an axis minimum, one or more work fields, or favorites-only and reloads the map overview
- **THEN** every selected filter is restored and the matching companies, filter controls, and active-filter count reflect that restored state

#### Scenario: Filters survive a detail-page round trip

- **WHEN** a visitor filters the map, opens a matching company's detail page, and returns to the map
- **THEN** the previous map filters remain active and the company is selected when it still matches them

#### Scenario: Restored filters reconcile an ineligible selection

- **WHEN** the map loads with persisted filters and `?selected=<company_id>` but that company no longer matches the persisted filters
- **THEN** the filters remain active, the peek card stays closed, and the `selected` parameter is removed

#### Scenario: Filters are locale-independent

- **WHEN** a visitor changes map filters on `/` and later opens `/en/`, or changes them on `/en/` and later opens `/`
- **THEN** the same axis minimums, work-field selections, and favorites-only setting are active with labels rendered in the current route's locale

#### Scenario: Reset clears only persisted map filters

- **WHEN** a visitor with persisted map filters activates the filter reset control and later reloads the map
- **THEN** the map uses empty filter defaults
- **AND** saved favorite companies, BYOK configuration, and Ikigai history or drafts are unchanged

#### Scenario: Malformed or obsolete storage is tolerated

- **WHEN** persisted map-filter data is malformed, partial, duplicated, or contains unknown axis levels or work-field identifiers
- **THEN** supported values are normalized and retained, invalid values use empty defaults, and the map remains usable

#### Scenario: Unavailable browser storage degrades safely

- **WHEN** browser-local storage is unavailable or rejects a map-filter read or write
- **THEN** map filtering remains functional for the current page lifetime using empty defaults when no state can be read
