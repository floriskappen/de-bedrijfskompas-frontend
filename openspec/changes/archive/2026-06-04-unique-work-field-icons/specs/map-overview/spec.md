## ADDED Requirements

### Requirement: Work-field chip icons

Each rendered work-field filter chip SHALL include a compact icon that is stable for that work-field identifier and visually distinct from the icons assigned to the other work-field identifiers. Icons SHALL inherit the chip text colour so active and inactive chip states remain legible.

#### Scenario: Work-field icons are unique

- **WHEN** the work-field icon mapping is loaded
- **THEN** every supported work-field identifier has exactly one icon path and no two work-field identifiers share the same icon path

#### Scenario: Work-field chip renders its assigned icon

- **WHEN** a work-field chip is visible in the filter panel
- **THEN** the chip renders the icon assigned to that work-field identifier
