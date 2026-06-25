## MODIFIED Requirements

### Requirement: Favorites overview page

The app SHALL provide a dedicated favorites overview page at `/favorieten/` for Dutch and `/en/favorites/` for English. The page SHALL render the current browser's saved companies after hydration, using the static company data for names, locality, tagline, and detail links. Each saved company SHALL be shown as a wine-themed card (the design system's warm surface token) carrying a peek-card-style identity header (monogram tile, name with locality tight beneath, and a save toggle) and a compass summary of one focus meter per axis (the shared focus-level indicator, with the axis glyph), rather than a cumulative score badge or per-axis text tags.

#### Scenario: Dutch favorites route

- **WHEN** a visitor opens `/favorieten/`
- **THEN** the page renders the favorites overview in Dutch

#### Scenario: English favorites route

- **WHEN** a visitor opens `/en/favorites/`
- **THEN** the page renders the favorites overview in English
