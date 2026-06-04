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

Every renderable company that matches the active filters MUST appear as either its own score-badge pin or be part of a cluster at its coordinates. At lower zoom levels, pins that are close to each other MUST be grouped into dynamic clusters. A cluster marker SHALL render in a distinct style, displaying the count of matching companies inside it. Clicking on a cluster marker MUST zoom the map to a level where the cluster expands into sub-clusters or individual score-badge pins. Companies whose axis scores are all `null` MUST still render an unknown badge and remain tappable when they match the active filters. The currently-selected pin SHALL carry an additional red halo ring. When two or more matching companies share the same `latlng` and are not clustered, their badges MUST fan out on a small, deterministic pixel-space rosette around the shared point so each badge stays individually visible and tappable regardless of how many are collocated.

#### Scenario: Every matching renderable company has one badge pin

- **WHEN** the map finishes rendering, no filters are active, and zoom level is maximum
- **THEN** every renderable company has exactly one score-badge pin or unknown badge pin

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null`, matches the active filters, and is not clustered
- **THEN** its unknown badge opens the peek card on tap

#### Scenario: Collocated companies fan out

- **WHEN** two or more matching companies share the same `latlng` and are not clustered
- **THEN** each badge is offset on a small rosette around the shared point so the badges do not overlap and every one can be tapped individually

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a score-badge pin is the currently-selected pin and is not clustered
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

#### Scenario: Dynamic clustering based on zoom

- **WHEN** the map zoom is low enough that two or more matching pins are close to each other
- **THEN** they are replaced by a cluster marker showing the count of matching companies in that cluster

#### Scenario: Clicking a cluster zooms in

- **WHEN** a user clicks on a cluster marker
- **THEN** the map zooms and centers on that cluster, expanding it to reveal its contents

### Requirement: Composite score badges

Each unclustered company pin SHALL render a compact composite-score badge instead of a uniform dot. The badge SHALL visually distinguish score badges from cluster markers by pairing the score with a small score glyph. The composite score SHALL be the rounded arithmetic mean of that company's available numeric axis scores; `null` scores MUST be ignored rather than counted as zero. If a company has no numeric axis scores, the badge SHALL render a distinct unknown marker. The badge MUST remain tappable, preserve selection behavior, and keep deterministic rosette offsets for collocated companies.

#### Scenario: Composite score ignores unknown axes

- **WHEN** a company has numeric scores `70`, `55`, `40`, and `50`, plus `power.score: null`
- **THEN** its unclustered pin badge displays `54`

#### Scenario: All-null scores display unknown badge

- **WHEN** a company has every axis `score: null` and is not clustered
- **THEN** its badge displays the unknown marker and still opens the peek card on tap

#### Scenario: Collocated score badges fan out

- **WHEN** two or more score-badge pins share the same `latlng` and are not clustered
- **THEN** each badge is offset on a small deterministic rosette so every badge stays visible and tappable

#### Scenario: Score badges are distinct from cluster markers

- **WHEN** a cluster expands into individual score-badge pins
- **THEN** the individual badges include a score glyph so their numbers are not presented with the same visual language as cluster counts

### Requirement: Map filtering

The map SHALL filter visible companies by active axis minimums and selected tags. Each axis filter has a minimum in `[0, 100]`; a minimum of `0` means no preference and MUST include companies with `null` for that axis, while any minimum above `0` MUST require a numeric score greater than or equal to that minimum. Selected tags MUST combine with AND semantics: a company matches only when it contains every selected tag. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter.

#### Scenario: Axis minimum keeps unknowns at zero

- **WHEN** the power minimum is `0`
- **THEN** companies with `scores.power.score: null` remain visible unless excluded by another active filter

#### Scenario: Axis minimum excludes unknowns above zero

- **WHEN** the power minimum is `5`
- **THEN** companies with `scores.power.score: null` are hidden from markers and clusters

#### Scenario: Tag filters combine with AND semantics

- **WHEN** `software-engineering` and `commercial` are both selected
- **THEN** only companies containing both tags remain visible

#### Scenario: Filtering clears hidden selection

- **WHEN** the currently selected company no longer matches the active filters
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain per-axis minimum sliders, score distribution histograms, tag chips with counts, and a reset affordance. Axis minimum sliders SHALL sit under the numeric histogram buckets and MUST NOT include the unknown bucket in the slider track. If the current company data contains no tags, the tag section SHALL show a quiet no-tags message instead of zero-count chips. The panel MUST be operable on mobile viewports and MUST respect reduced-motion preferences by opening directly without stepped motion. When a peek card is open, the filter panel SHALL render above both the peek card and the map markers. The panel's header controls (reset and close) SHALL remain visible and operable while the panel body scrolls, and SHALL share a common height. The panel header SHALL also be draggable downward to dismiss the panel. Axis and tag chip labels SHALL be localized to the active locale, while tag identifiers remain locale-neutral.

#### Scenario: Icon-only filter button opens panel

- **WHEN** a user taps the top-right filters icon
- **THEN** the bottom-sheet filter panel opens without navigating or changing locale

#### Scenario: Reset clears active filters

- **WHEN** active score or tag filters exist and the user activates reset
- **THEN** all axis minimums return to `0`, all tags are deselected, and every otherwise renderable company is visible

#### Scenario: Active filters are counted on button

- **WHEN** one axis minimum and one tag filter are active
- **THEN** the filters button shows an active count of `2`

#### Scenario: No tags data shows empty tag section

- **WHEN** the current company data contains no tag values
- **THEN** the tag section shows that there are no tags in the current data and does not render zero-count tag chips

#### Scenario: Filter panel layers above an open peek card

- **WHEN** a peek card is open and the user opens the filter panel
- **THEN** the filter panel renders above the peek card and the map markers, not behind them

#### Scenario: Panel header stays reachable while scrolling

- **WHEN** the filter panel body is scrolled to its bottom
- **THEN** the reset and close controls remain visible and operable at the top of the panel

#### Scenario: Dragging the panel header dismisses the panel

- **WHEN** the user drags the filter panel header downward past the dismiss threshold
- **THEN** the filter panel closes

#### Scenario: Reduced motion skips panel animation

- **WHEN** a user whose system preference is reduced motion opens the filter panel
- **THEN** the panel appears directly in its open state without stepped slide motion

### Requirement: Filter distributions and counts

Each score filter SHALL show a leftmost unknown bucket for `null` scores and ten numeric histogram buckets covering `0-9`, `10-19`, `20-29`, `30-39`, `40-49`, `50-59`, `60-69`, `70-79`, `80-89`, and `90-100`. Numeric sliders MUST map directly to bucket starts `0`, `10`, `20`, `30`, `40`, `50`, `60`, `70`, `80`, and `90`; setting the slider to `50` means a minimum score of `50`. Histogram counts MAY update against the current filter combination while excluding the facet currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another bucket visually grow. Tag chips SHALL show a count and MUST update against the current filter combination while excluding the tag currently being counted.

#### Scenario: Histogram includes unknown bucket

- **WHEN** an axis has companies with `score: null`
- **THEN** that axis histogram shows an unknown bucket count to the left of the numeric buckets

#### Scenario: Histogram buckets aggregate by tens

- **WHEN** ecology scores include `55`, `62`, and `75`
- **THEN** the histogram counts them in `50-59`, `60-69`, and `70-79`

#### Scenario: Slider threshold aligns with bucket label

- **WHEN** a user sets the slider thumb to the `50` position under a score histogram
- **THEN** the active minimum for that axis is `50`, so every visible company must have a numeric score greater than or equal to `50` on that axis unless the minimum is reset to `0`

#### Scenario: Counts update with other active filters

- **WHEN** a user selects `commercial`
- **THEN** score histograms and other tag counts update to show counts for companies matching `commercial`

#### Scenario: Histogram bars do not grow while filtering

- **WHEN** a user raises an axis minimum that removes companies from the visible set
- **THEN** buckets in other score histograms may shrink or stay the same height, but they do not grow taller

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

When a company is selected, a peek card MUST overlay the bottom of the map showing — in order — a pentagon of all five axis scores, the company's identity (an identity tile, name, locality with optional distance), and its tagline in the current locale as plain inline text. The identity tile SHALL render the company's favicon when `favicon_url` is present and loads successfully, and SHALL fall back to a square ink monogram tile (the uppercase first character of `name` on the ink background) when `favicon_url` is absent or the favicon image fails to load. The card's top-right corner SHALL carry two icon buttons: an inert bookmark affordance and an explicit close (✕) button that clears the selection. The whole card SHALL be the primary affordance: a tap (or Enter/Space when focused) opens the company's detail route, and the whole card SHALL be the drag surface. Dragging down past a small threshold closes the card; releasing before it snaps back; dragging upward MUST feel very stiff (rubber-band with a small hard cap) and snap back on release. The card SHALL slide in from the bottom with a snappy, stepped animation, and the map SHALL pan in parallel so the selected pin sits in the centre of the strip of map still visible above the card.

#### Scenario: Pentagon leads, then identity, then tagline

- **WHEN** the peek card renders for a company whose `name` is "Fairphone"
- **THEN** the pentagon of five axis scores appears first, the identity tile sits beside the company name "Fairphone" with a locality line reading `address.city` underneath, and the current-locale tagline renders as plain text below

#### Scenario: Identity tile prefers favicon, falls back to monogram

- **WHEN** a selected company has a `favicon_url` that loads successfully
- **THEN** the identity tile renders the favicon

#### Scenario: Identity tile falls back when favicon is missing or broken

- **WHEN** a selected company has no `favicon_url`, or its favicon fails to load
- **THEN** the identity tile renders the square ink monogram (uppercase first character of `name`) instead

#### Scenario: Tagline renders in the current locale

- **WHEN** a user on `/` selects `gravity`
- **THEN** the tagline body renders `gravity.nl.tagline`; on `/en/`, it renders `gravity.en.tagline`

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

#### Scenario: Tapping the card opens the detail route

- **WHEN** the user taps the card without dragging it, or presses Enter/Space while it is focused
- **THEN** the browser navigates to the selected company's detail route

#### Scenario: Dragging down closes the card; short drag snaps back

- **WHEN** the user drags the card down past roughly a third of its height and releases
- **THEN** the card continues down to closed and the selection clears; if released before the threshold, the card snaps back to its open position, the selection is preserved, and no navigation occurs

#### Scenario: Up-drag is stiff and bounded

- **WHEN** the user drags the card upward
- **THEN** the card resists strongly, never lifting more than a small hard cap, and snaps back on release; it never navigates to the full profile

#### Scenario: Close and bookmark buttons do not drag or navigate

- **WHEN** the user presses the top-right close (✕) or bookmark button
- **THEN** the press does not start a card drag or open the detail route; the close button clears the selection and closes the card, and the bookmark is inert

### Requirement: Detail navigation

The peek card MUST navigate to the detail route for the selected company when the card is activated: `/<company_id>/` from `/`, and `/en/<company_id>/` from `/en/`. The whole card is the activation surface — a tap or Enter/Space when focused. Slugs SHALL NOT be translated between locales.

#### Scenario: Activation preserves locale and uses the company slug

- **WHEN** a user on `/en/` selects `gravity` and taps the card (or presses Enter)
- **THEN** they navigate to `/en/gravity/`

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

The map experience MUST surface an icon-only filters button anchored top-right above the basemap. The control SHALL use the map page visual idiom: sharp corners, paper background, 1px ink border, and mono-accessible labeling via `aria-label`. Activating the filters button SHALL open the filter panel.

#### Scenario: Filters button opens panel

- **WHEN** a user taps the filters button
- **THEN** the filter panel opens and the URL does not change

### Requirement: Visual design system

The map page MUST render on the de-ontwerp visual identity: the active skin's paper surfaces, ink scale, and single red accent, Archivo as the sans family and JetBrains Mono as the monospace family. User-visible body copy SHALL render lowercase, with one exception: proper-name strings sourced from the company data contract (notably `company.name` and the monogram derived from it) SHALL preserve their source casing. Mono-family labels SHALL render uppercase as utility marks with visible letter-tracking. The peek card and body background SHALL carry a paper-grain texture; the Mapbox basemap canvas is exempt.

#### Scenario: Body copy renders lowercase, proper names keep source casing

- **WHEN** user-visible text renders outside of a mono utility mark
- **THEN** it appears lowercase regardless of the source string's casing; but a company `name` like "Fairphone" and its monogram "F" preserve source casing

#### Scenario: Mono utility marks render uppercase with tracking

- **WHEN** a label uses the mono family (e.g. the axis labels in the pentagon)
- **THEN** it appears uppercase with visible letter-tracking

### Requirement: Initial map reveal

On initial page load, the map experience SHALL reveal the full map surface from behind a brief stepped paper-grain cover animation. The reveal SHALL apply on both `/` and `/en/`, complete automatically into the normal full-screen map view, and respect reduced-motion preferences by rendering directly in the final state when motion is reduced. The reveal MUST NOT transform or resize the map surface, and MUST NOT prevent existing initial state behavior such as auto-fit, empty state rendering, or `?selected` deep-link selection.

#### Scenario: First load reveals from paper

- **WHEN** a user navigates to `/` or `/en/`
- **THEN** the map page starts behind a paper-grain cover, reveals in stepped openings, and settles into the normal full-screen map view

#### Scenario: Reduced motion skips the reveal

- **WHEN** a user whose system preference is reduced motion navigates to `/` or `/en/`
- **THEN** the map page renders directly in the normal full-screen map view without the reveal animation

#### Scenario: Deep-link state survives the reveal

- **WHEN** a user opens `/?selected=<known-id>` or `/en/?selected=<known-id>`
- **THEN** the reveal does not prevent the matching company from being selected and the peek card from opening

### Requirement: Ontwerp-aligned map UI

The map overview MUST render app-owned map chrome, score badges, clusters, filter controls, bottom sheets, peek cards, empty states, and score graphics using the pinned ontwerp design system's semantic values and relevant recipes. Existing map behavior, route behavior, URL selection state, filter semantics, geolocation behavior, localization, and null-score semantics MUST remain unchanged.

#### Scenario: Map UI uses pinned values

- **WHEN** `/` or `/en/` renders the map overview
- **THEN** app-owned map UI surfaces, text, borders, controls, markers, badges, and state overlays use values derived from `vendor/ontwerp/values/`

#### Scenario: Map behavior is preserved

- **WHEN** the map overview is reskinned with ontwerp values and recipes
- **THEN** existing pin selection, cluster expansion, geolocation, filtering, URL state, peek-card content, and locale behavior continue to match the map-overview requirements

#### Scenario: Interactions follow stepped or immediate motion

- **WHEN** a user opens the peek card, opens the filter sheet, presses app-owned buttons, changes filters, selects pins, or uses app-owned map controls
- **THEN** app-owned motion is either immediate, stepped, or disabled under reduced-motion preferences rather than using generic smooth/default transitions

#### Scenario: Status and unknown states avoid generic defaults

- **WHEN** the map renders empty states, active filter counts, selected pins, unknown score badges, null axes, or unavailable tag sections
- **THEN** those states use ontwerp-compatible paper, ink, accent, mono utility marks, and distinct unknown/no-signal treatments rather than default blue, green check, spinner, or rounded system styles

#### Scenario: Deterministic map extensions are recorded

- **WHEN** app-specific map UI extends beyond the shipped ontwerp recipes
- **THEN** `.design/DESIGN.md` records the extension and names the relevant recipes or principles it follows

#### Scenario: Themed surfaces stay subtle and legible

- **WHEN** the ambient bloom, peek card, and filter surfaces apply the active skin
- **THEN** they carry only a faint wash of the theme while saturated accent colour is reserved for intentional accents (CTA, active tags, cluster pigment, indicator dots), and dark themed marks such as the cluster pigment keep their numerals legible

#### Scenario: Basemap is the stock Mapbox style under the bloom

- **WHEN** the basemap renders
- **THEN** the app does not recolour the Mapbox layers; the map shows the stock Mapbox "light" style and only the ambient `.map-atmosphere` bloom carries the active skin over it

