# Map Overview

Capability rendering the interactive Mapbox map, pins, selection, peek card, language switcher, and browser geolocation.

## Requirements

### Requirement: Routes

The map experience MUST be reachable at two routes: `/` (Dutch, default, unprefixed) and `/en/` (English mirror). Both routes render the same map and pin set; only the page chrome (UI strings) and the prose sourced from company records SHALL differ between them.

#### Scenario: Dutch route at root

- **WHEN** a user navigates to `/`
- **THEN** the page renders the map with Dutch UI strings and Dutch company prose

#### Scenario: English route under /en/

- **WHEN** a user navigates to `/en/`
- **THEN** the page renders the map with English UI strings and English company prose

### Requirement: Map view initialization

On page load, an interactive Mapbox map MUST render covering the page background. The initial viewport SHALL be auto-fitted to enclose every renderable company's coordinates with a small padding, unless a `?selected` query parameter is present and resolves to a known company — in which case the initial viewport SHALL center on that company.

#### Scenario: Auto-fit on cold load

- **WHEN** the page loads without `?selected`
- **THEN** the map's initial bounds enclose every rendered pin with padding

#### Scenario: Deep-link initial viewport

- **WHEN** the page loads with `?selected=<known-id>`
- **THEN** the initial viewport centers on that company's coordinates

### Requirement: Pin rendering

Every renderable company MUST appear as exactly one pin at its `latlng`. All pins SHALL render with the same visual style: a medium ink (black) dot with a standard halo (medium size, ink color, no blur).

#### Scenario: Each renderable company has exactly one pin

- **WHEN** the map finishes rendering
- **THEN** the number of pins equals the size of the renderable collection

#### Scenario: Pin renders as a uniform ink dot

- **WHEN** a company's pin is rendered
- **THEN** it renders with the uniform ink style (medium, ink color, standard halo)

#### Scenario: All-null company renders with the uniform ink dot and stays tappable

- **WHEN** a company has every axis `score: null`
- **THEN** its pin renders with the same uniform ink style and is still tappable to open a peek card

### Requirement: Pin selection and URL state

Tapping a pin MUST select the corresponding company and persist the selection in the URL as `?selected=<company_id>`. Tapping the selected pin again, tapping outside any pin, or pressing Escape SHALL clear the selection. Selection deep-links MUST survive reload.

#### Scenario: Selecting a pin updates the URL and opens the peek card

- **WHEN** a user taps the pin for `fairphone`
- **THEN** the URL becomes `?selected=fairphone` and the Fairphone peek card opens

#### Scenario: Deep-link opens peek card on first paint

- **WHEN** a user opens a page with `?selected=fairphone`
- **THEN** the corresponding pin is rendered as selected and the peek card is open before user interaction

#### Scenario: Unknown selection is ignored

- **WHEN** the URL carries `?selected=<unknown-id>`
- **THEN** no peek card opens and the unrecognized parameter is removed from the URL

#### Scenario: Clearing selection

- **WHEN** a user taps the currently-selected pin, taps outside any pin, or presses Escape
- **THEN** the peek card closes and the `selected` parameter is removed from the URL

### Requirement: Peek card content

When a company is selected, a peek card MUST overlay the bottom of the map. The peek card SHALL contain, in order: the company's `name` as the heading; a single locality line drawn from `address.city`; the **tagline** in the current locale (with fallback to the other locale per `company-data`); a pentagon visualization of all five axis scores in fixed order — `substance`, `ecology`, `power`, `embeddedness`, `posture` — with null-scored axes rendered visually distinct from low-scored axes; a primary CTA labeled "open volledig profiel" (nl) / "open full profile" (en); and a secondary bookmark action that is visually present but inert.

#### Scenario: Peek card renders current-locale prose

- **WHEN** a user on `/` selects `gravity`
- **THEN** the peek card renders `gravity.nl.tagline`; on `/en/`, the same selection renders `gravity.en.tagline`

#### Scenario: Pentagon renders all five axes including nulls

- **WHEN** a selected company has `scores.power.score: null`
- **THEN** the pentagon's power arm renders in the null style while the other four arms render at their numeric values

### Requirement: Detail navigation

The peek card's primary CTA MUST navigate to the detail route for the selected company: `/<company_id>/` from `/`, and `/en/<company_id>/` from `/en/`. Slugs SHALL NOT be translated between locales.

#### Scenario: CTA preserves locale and uses the company slug

- **WHEN** a user on `/en/` selects `gravity` and activates the CTA
- **THEN** they navigate to `/en/gravity/`

### Requirement: Language switcher

The page MUST expose a language switcher that toggles between `/` and `/en/`. Switching SHALL preserve any active `?selected` parameter so the same pin remains selected across the locale change.

#### Scenario: Switcher preserves selection across locales

- **WHEN** a user on `/?selected=gravity` activates the language switcher
- **THEN** they arrive at `/en/?selected=gravity` with Gravity still selected

#### Scenario: Switcher toggles back to default

- **WHEN** a user on `/en/` (with no querystring) activates the switcher
- **THEN** they navigate to `/`

### Requirement: Empty data state

When the renderable company collection is empty at build time, the route MUST build successfully and render the map with no pins plus a quiet overlay message ("geen bedrijven in beeld" on `/`, "no companies in view" on `/en/`).

#### Scenario: Empty collection still renders the map

- **WHEN** there are zero renderable companies at build time
- **THEN** the map renders with no pins and the quiet overlay message is visible

### Requirement: User Geolocation and Distance Display

The page MUST display a geolocation toggle button on the map. Activating the button requests browser location permission. If granted, the map SHALL display a distinct blue dot marker at the user's location and center the viewport on it. When a company pin is selected, and user location is active, the peek card MUST render the calculated distance (in kilometers, rounded to one decimal place, e.g. "2.4 km" or "15.0 km") directly under the company's city/locality line.

#### Scenario: User geolocation shows location marker and centers map

- **WHEN** the user clicks the geolocation button and grants permission
- **THEN** a user location pin is added to the map and the map centers on their coordinates

#### Scenario: Selected company displays distance from user

- **WHEN** user location is active and the user selects a company pin
- **THEN** the peek card displays the distance in kilometers from the user to the company (e.g. "x.x km")
