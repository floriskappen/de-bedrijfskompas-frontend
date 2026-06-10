## MODIFIED Requirements

### Requirement: Map chrome

The map experience MUST surface icon-only chrome controls anchored above the basemap for filters, project context, the favorites overview, and the Ikigai matching flow. These controls SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel. Activating the project-context button SHALL navigate to the philosophy page (`/over/` for Dutch, `/en/about/` for English). Activating the favorites button SHALL navigate to the favorites overview page (`/favorieten/` for Dutch, `/en/favorites/` for English). Activating the Ikigai/matching button SHALL start the matching entry path, opening the bring-your-own-key setup when no confirmed browser-local LLM configuration is available and opening the Ikigai matching flow when a confirmed configuration is available.

#### Scenario: Favorites chrome button opens overview

- **WHEN** a visitor activates the map favorites button
- **THEN** they are taken to the localized favorites overview page

#### Scenario: Ikigai chrome button opens BYOK setup

- **WHEN** a visitor activates the map Ikigai/matching button without a confirmed browser-local LLM configuration
- **THEN** the bring-your-own-key setup opens instead of running matching prompts

#### Scenario: Ikigai chrome button opens matching flow

- **WHEN** a visitor activates the map Ikigai/matching button with a confirmed browser-local LLM configuration
- **THEN** the Ikigai matching flow opens from the map
