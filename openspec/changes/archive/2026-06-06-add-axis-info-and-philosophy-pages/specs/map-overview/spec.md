## MODIFIED Requirements

### Requirement: Map chrome

The map experience MUST surface two icon-only chrome buttons anchored above the basemap: a filters button in the top-right, and a philosophy / "why this site" button in the top-left. Both controls SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and mono-accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel. Activating the philosophy button SHALL navigate to the philosophy page (`/over/` for Dutch, `/en/about/` for English).

#### Scenario: Filters button opens panel

- **WHEN** a user taps the filters button
- **THEN** the filter panel opens and the URL does not change

#### Scenario: Philosophy button opens the about page

- **WHEN** a user taps the top-left philosophy button
- **THEN** they are taken to the philosophy page for the current locale (`/over/` for Dutch, `/en/about/` for English)
