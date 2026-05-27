# Map Overview

## Purpose

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

Every renderable company MUST appear as either its own pin or be part of a cluster at its coordinates. At lower zoom levels, pins that are close to each other MUST be grouped into dynamic clusters. A cluster marker SHALL render in a distinct style, displaying the count of companies inside it. Clicking on a cluster marker MUST zoom the map to a level where the cluster expands into sub-clusters or individual pins. Pins that are not clustered SHALL render in the uniform style — an ink dot with a thin paper-warm outline and a quiet ink halo. Companies whose axis scores are all `null` MUST still render a pin and remain tappable. The currently-selected pin SHALL carry an additional red halo ring. When two or more companies share the same `latlng` and are not clustered, their pins MUST fan out on a small, deterministic pixel-space rosette around the shared point so each pin stays individually visible and tappable regardless of how many are collocated.

#### Scenario: Every renderable company has one uniform pin

- **WHEN** the map finishes rendering and zoom level is maximum
- **THEN** every renderable company has exactly one pin and all pins share the same colour, size, and halo

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null` and is not clustered
- **THEN** its pin still renders in the uniform style and opens the peek card on tap

#### Scenario: Collocated companies fan out

- **WHEN** two or more companies share the same `latlng` and are not clustered
- **THEN** each pin is offset on a small rosette around the shared point so the pins do not overlap and every one can be tapped individually

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a pin is the currently-selected pin and is not clustered
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

#### Scenario: Dynamic clustering based on zoom

- **WHEN** the map zoom is low enough that two or more pins are close to each other
- **THEN** they are replaced by a cluster marker showing the count of companies in that cluster

#### Scenario: Clicking a cluster zooms in

- **WHEN** a user clicks on a cluster marker
- **THEN** the map zooms and centers on that cluster, expanding it to reveal its contents

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

When a company is selected, a peek card MUST overlay the bottom of the map showing — in order — the company's identity (monogram, name, locality with optional distance), its tagline in the current locale highlighted inside an "in het echt" / "in real life" callout, a pentagon of all five axis scores, a primary "open volledig profiel" / "open full profile" CTA, and an inert bookmark affordance. The card MUST NOT show an explicit close button; selection clears via Escape, tapping outside any pin, tapping the selected pin again, or dragging the card down. The card SHALL slide in from the bottom with a snappy, stepped animation, and the map SHALL pan in parallel so the selected pin sits in the centre of the strip of map still visible above the card. The drag handle SHALL be draggable: dragging down past a small threshold closes the card; releasing before it snaps back; dragging upward MUST feel very stiff (rubber-band with a small hard cap) and snap back on release.

#### Scenario: Header pairs monogram, name, and locality

- **WHEN** the peek card renders for a company whose `name` is "Fairphone"
- **THEN** a square monogram showing "F" sits beside the company name "Fairphone", with a locality line reading `address.city` underneath

#### Scenario: Callout renders current-locale tagline

- **WHEN** a user on `/` selects `gravity`
- **THEN** the callout label reads "in het echt" and the body renders `gravity.nl.tagline`; on `/en/`, the label reads "in real life" and the body renders `gravity.en.tagline`

#### Scenario: Locality line appends distance when geolocated

- **WHEN** user location is active and the selected company has a `latlng`
- **THEN** the locality line reads `{city} · {distance} km` (distance to one decimal place)

#### Scenario: Pentagon renders all five axes including nulls

- **WHEN** a selected company has `scores.power.score: null`
- **THEN** the pentagon's power arm renders in the null style (dashed spoke, "?" glyph) while the other four arms render at their numeric values

#### Scenario: Selected pin stays visible above the peek card

- **WHEN** a user taps a pin and the peek card opens
- **THEN** the map pans so the pin sits in the centre of the strip of map still visible above the card, not behind it

#### Scenario: Stepped slide-in on appear; in-place swap on switch

- **WHEN** the card appears after being closed
- **THEN** it slides up from the bottom with a snappy, stepped (non-smooth) motion, and the map pan completes in parallel; tapping a different pin while the card is open swaps content in place without replaying the slide-in

#### Scenario: Dragging down closes the card; short drag snaps back

- **WHEN** the user drags the drag handle down past roughly a third of the card's height and releases
- **THEN** the card continues down to closed and the selection clears; if released before the threshold, the card snaps back to its open position and the selection is preserved

#### Scenario: Up-drag is stiff and bounded

- **WHEN** the user drags the drag handle upward
- **THEN** the card resists strongly, never lifting more than a small hard cap, and snaps back on release; it never navigates to the full profile

#### Scenario: No explicit close button

- **WHEN** the peek card is open
- **THEN** no X / close button is rendered; the card clears only via Escape, tapping outside any pin, tapping the currently-selected pin, or dragging it down

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

### Requirement: Map chrome

The map experience MUST surface two chrome elements above the basemap: a *filters pill* anchored top-right showing the filters icon and the word "filters" — visually present but inert until the filters capability ships; and a *bottom hint*, anchored above the safe-area bottom and only visible while no pin is selected, reading `{n} bedrijven in beeld · tik een pin` (nl) / `{n} companies in view · tap a pin` (en) where `{n}` is the size of the renderable collection. All chrome (filters pill, language switcher, bottom hint) SHALL share one visual idiom: sharp corners, paper background, 1px ink border, mono-uppercase label.

#### Scenario: Filters pill is inert

- **WHEN** a user taps the filters pill
- **THEN** nothing happens (no panel opens, no URL change) — the pill is a placeholder for the future filters capability

#### Scenario: Bottom hint reflects renderable count and hides on selection

- **WHEN** the page renders with N renderable companies and no `?selected`
- **THEN** the bottom hint reads "N bedrijven in beeld · tik een pin" (nl) / "N companies in view · tap a pin" (en); when a pin is selected the hint is hidden

### Requirement: Visual design system

The map page MUST render on the de-ontwerp visual identity: the paper palette (paper `#F1ECE0`, paper-warm `#ECE4D2`, paper-deep `#E4DBC4`), the ink scale (ink `#1F1B16`, ink-soft, ink-quiet, ink-faint), a single red accent (`#B84A39`), Archivo as the sans family and JetBrains Mono as the monospace family. User-visible body copy SHALL render lowercase, with one exception: proper-name strings sourced from the company data contract (notably `company.name` and the monogram derived from it) SHALL preserve their source casing. Mono-family labels SHALL render uppercase as utility marks with visible letter-tracking. The peek card and body background SHALL carry a paper-grain texture; the Mapbox basemap canvas is exempt.

#### Scenario: Body copy renders lowercase, proper names keep source casing

- **WHEN** user-visible text renders outside of a mono utility mark
- **THEN** it appears lowercase regardless of the source string's casing; but a company `name` like "Fairphone" and its monogram "F" preserve source casing

#### Scenario: Mono utility marks render uppercase with tracking

- **WHEN** a label uses the mono family (e.g. the "in het echt" callout label, the bottom hint, axis labels in the pentagon)
- **THEN** it appears uppercase with visible letter-tracking

