# local-favorites Specification

## Purpose
TBD - created by archiving change add-local-favorites. Update Purpose after archive.
## Requirements
### Requirement: Local persistence

Favorites SHALL be stored only in the visitor's browser using stable `company_id` values. The feature SHALL NOT require accounts, backend requests, analytics, cookies, or changes to the company data contract. The same stored favorites SHALL be available across Dutch and English routes in the same browser profile.

#### Scenario: Favorite persists after reload

- **WHEN** a visitor saves a company as a favorite
- **AND** reloads the page
- **THEN** that company is still marked as a favorite

#### Scenario: Favorite is locale-independent

- **WHEN** a visitor saves a company on a Dutch route
- **THEN** the same company is marked as a favorite on the matching English route

#### Scenario: Malformed storage is tolerated

- **WHEN** the browser storage value for favorites is missing, malformed, duplicated, or contains non-string values
- **THEN** the app treats invalid entries as absent and remains usable

#### Scenario: Unknown saved company is hidden

- **WHEN** browser storage contains a company id that is not present in the current company data
- **THEN** the favorites UI does not render that unknown company as a visible favorite

### Requirement: Favorite toggles

The map peek card and company detail top bar SHALL expose the current company favorite state as an icon toggle. Activating the toggle SHALL add the company to favorites when it is not saved, and remove it when it is saved. The toggle SHALL expose selected state to assistive technology and use localized labels for add and remove actions.

#### Scenario: Save from peek card

- **WHEN** a visitor opens a company peek card and activates the favorite toggle
- **THEN** the company is saved as a favorite
- **AND** the peek-card toggle shows selected state

#### Scenario: Remove from detail page

- **WHEN** a visitor opens a saved company's detail page and activates the favorite toggle
- **THEN** the company is removed from favorites
- **AND** the detail-page toggle no longer shows selected state

#### Scenario: Separate surfaces stay synchronized

- **WHEN** favorite state changes in one hydrated surface or browser tab
- **THEN** other visible favorite-aware surfaces update to the same state without requiring a full page reload

### Requirement: Favorites overview page

The app SHALL provide a dedicated favorites overview page at `/favorieten/` for Dutch and `/en/favorites/` for English. The page SHALL render the current browser's saved companies after hydration, using the static company data for names, locality, tagline, and detail links. Each saved company SHALL be shown as a wine-themed card (the design system's warm surface token) carrying a peek-card-style identity header (favicon tile with monogram fallback, name with locality tight beneath, and a save toggle) and a compass summary of one focus meter per axis (the shared focus-level indicator, with the axis glyph), rather than a cumulative score badge or per-axis text tags.

#### Scenario: Dutch favorites route

- **WHEN** a visitor opens `/favorieten/`
- **THEN** the page renders the favorites overview in Dutch

#### Scenario: English favorites route

- **WHEN** a visitor opens `/en/favorites/`
- **THEN** the page renders the favorites overview in English

#### Scenario: Empty favorites page

- **WHEN** the visitor has no saved companies in current data
- **THEN** the favorites page shows a localized empty state instead of an empty list

#### Scenario: Favorite list links to detail pages

- **WHEN** the favorites page renders saved companies
- **THEN** each listed company links to its localized detail page
- **AND** the whole card is the affordance — clicking anywhere on the card (other than the save toggle) opens that detail page, like the peek card

#### Scenario: Favorite card shows a focus meter per axis

- **WHEN** the favorites page renders a saved company
- **THEN** its card shows one focus meter per axis (five in total) as the compass summary, and shows no cumulative score badge or per-axis text tags

