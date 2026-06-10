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

The map SHALL filter visible companies by active axis minimums, selected work fields, and an optional favorites-only toggle. Each axis filter has a focus-level minimum. A minimum of `none` means no preference and MUST include companies with `null` for that axis, while `low`, `medium`, and `high` require a numeric signal at that focus level or higher. Selected work fields MUST combine with AND semantics: a company matches only when its ISCO minor-code projections include every selected work field. When favorites-only is active, a company MUST also be present in the visitor's locally stored favorite ids. Filtering MUST update markers, clusters, and the empty state without changing the `selected` URL parameter except when the currently selected company no longer matches the active filters.

#### Scenario: Favorites-only shows saved companies

- **WHEN** the visitor has saved one company as a favorite
- **AND** enables the favorites-only filter
- **THEN** only otherwise matching favorite companies remain visible

#### Scenario: Favorites-only composes with other filters

- **WHEN** favorites-only is active
- **AND** the visitor also selects an axis minimum or work-field filter
- **THEN** only favorite companies matching those additional filters remain visible

#### Scenario: Unfavoriting hidden selection clears peek card

- **WHEN** favorites-only is active and the selected company is visible only because it is saved
- **AND** the visitor removes that company from favorites
- **THEN** the peek card closes and the `selected` URL parameter is removed

### Requirement: Filter panel

The map SHALL expose an icon-only filters button in the top-right map chrome. Activating it SHALL open a bottom-sheet panel with a stepped slide-up animation. When filters are active, the button SHALL show a small active-filter count badge. The panel SHALL contain a favorites-only toggle, per-axis focus-level controls, focus-level distribution histograms, work-field chips with counts, and a reset affordance. The favorites-only toggle SHALL be presented as a switch at the top of the panel — above the axis controls — rather than as a tag/chip among the work-field chips, carrying its localized label, the matching favorite count, and a sliding on/off state. The toggle SHALL be enabled when the browser supports local storage, SHALL show selected state (`aria-pressed`) when active, and SHALL not remove saved favorites when reset clears filters. The filter panel SHALL NOT itself link to the favorites overview page; the overview is reached from the map chrome favorites button. Axis and work-field labels SHALL be localized to the active locale, while ISCO codes and work-field identifiers remain locale-neutral.

#### Scenario: Favorites switch counts as active

- **WHEN** the visitor enables the favorites-only switch
- **THEN** the filters button active count increases by one

#### Scenario: Favorites switch sits above the axes

- **WHEN** the filter panel renders
- **THEN** the favorites-only switch appears at the top of the panel, above the per-axis level controls, and the panel offers no separate favorites-overview link

#### Scenario: Reset preserves saved favorites

- **WHEN** favorites-only is active and the visitor activates reset
- **THEN** favorites-only becomes inactive
- **AND** saved favorite companies remain saved

### Requirement: Filter distributions and counts

Each axis filter SHALL show a leftmost no-signal bucket for `null` scores and focus-level buckets for low, medium, and high. Axis histogram counts MAY update against the current filter combination while excluding the axis currently being counted, but histogram bar height MUST use a stable scale from the unfiltered data so filtering companies out never makes another bucket visually grow. Work-field chips and the favorites-only toggle SHALL show counts that update against the current filter combination while excluding the facet currently being counted.

#### Scenario: Favorites count respects other filters

- **WHEN** the visitor selects a work-field or axis filter
- **THEN** the favorites-only toggle count shows saved companies matching those other active filters

#### Scenario: Other facet counts respect favorites-only

- **WHEN** favorites-only is active
- **THEN** axis histograms and work-field chip counts are calculated from favorite companies that match the other active filters

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

When a company is selected, a peek card MUST overlay the bottom of the map showing, in order, a pentagon of all five axis scores, the company's identity, and its tagline in the current locale as plain inline text. The identity tile SHALL render the company's favicon when `favicon_url` is present and loads successfully, and SHALL fall back to a square ink monogram tile when `favicon_url` is absent or the favicon image fails to load. The card's top-right corner SHALL carry two icon buttons: a favorite toggle and an explicit close button that clears the selection. The whole card SHALL be the primary affordance: a tap or Enter/Space when focused opens the company's detail route, and the whole card SHALL be the drag surface.

#### Scenario: Favorite toggle does not open detail page

- **WHEN** a visitor activates the peek-card favorite toggle
- **THEN** the selected company favorite state changes
- **AND** the peek card remains open
- **AND** the visitor is not navigated to the detail page

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

### Requirement: Visual design system

The map page MUST render on the de-ontwerp visual identity: the active skin's paper surfaces, ink scale, and single red accent, Archivo as the sans family and JetBrains Mono as the monospace family. User-visible body copy SHALL render lowercase, with one exception: proper-name strings sourced from the company data contract (notably `company.name` and the monogram derived from it) SHALL preserve their source casing. Mono-family labels SHALL render uppercase as utility marks with visible letter-tracking. The peek card and body background SHALL carry a paper-grain texture; the Mapbox basemap canvas is exempt.

#### Scenario: Body copy renders lowercase, proper names keep source casing

- **WHEN** user-visible text renders outside of a mono utility mark
- **THEN** it appears lowercase regardless of the source string's casing; but a company `name` like "Fairphone" and its monogram "F" preserve source casing

#### Scenario: Mono utility marks render uppercase with tracking

- **WHEN** a label uses the mono family (e.g. the axis labels in the pentagon)
- **THEN** it appears uppercase with visible letter-tracking

### Requirement: Initial map reveal

When the map is entered directly — a first visit, a reload, or a deep link — the map experience SHALL reveal the full map surface from behind a brief stepped paper-grain cover animation. The reveal SHALL apply on both `/` and `/en/`, complete automatically into the normal full-screen map view, and respect reduced-motion preferences by rendering directly in the final state when motion is reduced. When the map is instead reached by an in-app bloom transition from the detail page (the detail back control returning to the map), the reveal SHALL be skipped and the map SHALL appear at once, because the conceal curtain has already bridged the cut. The skip decision SHALL be made before the cover paints, so neither path shows a flash of the other. The reveal MUST NOT transform or resize the map surface, and MUST NOT prevent existing initial state behavior such as auto-fit, empty state rendering, or `?selected` deep-link selection.

#### Scenario: Direct entry reveals from paper

- **WHEN** a user navigates to `/` or `/en/` directly, reloads it, or opens a deep link
- **THEN** the map page starts behind a paper-grain cover, reveals in stepped openings, and settles into the normal full-screen map view

#### Scenario: Return from detail skips the reveal

- **WHEN** the user activates the detail page back control and the map is reached through the in-app bloom transition
- **THEN** the map appears immediately without the stepped paper-grain cover animation

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

### Requirement: Overlay surface alignment

The peek card surface SHALL use the same background colour token as the filter panel header while preserving the paper-grain texture, border, radius, and shadow treatment that distinguish it from the map canvas.

#### Scenario: Peek card matches filter header surface

- **WHEN** a company is selected and the filter panel header is available in the same theme
- **THEN** the peek card background colour matches the filter panel header background colour

### Requirement: Work-field chip icons

Each rendered work-field filter chip SHALL include a compact icon that is stable for that work-field identifier and visually distinct from the icons assigned to the other work-field identifiers. Icons SHALL inherit the chip text colour so active and inactive chip states remain legible.

#### Scenario: Work-field icons are unique

- **WHEN** the work-field icon mapping is loaded
- **THEN** every supported work-field identifier has exactly one icon path and no two work-field identifiers share the same icon path

#### Scenario: Work-field chip renders its assigned icon

- **WHEN** a work-field chip is visible in the filter panel
- **THEN** the chip renders the icon assigned to that work-field identifier

### Requirement: Saved-company map marker

A company's map marker SHALL carry a small favorite mark (an accent star pinned to the top-right of its score tag) when that company is in the visitor's locally stored favorites, and SHALL omit the mark otherwise. The mark SHALL update live as favorites change — without a page reload — and applies to both the interactive (Mapbox) markers and the non-WebGL fallback markers.

#### Scenario: Saved company shows a favorite mark

- **WHEN** a company is saved as a favorite and its marker is visible on the map
- **THEN** its marker shows the favorite mark on the top-right of the score tag

#### Scenario: Favorite mark clears when unsaved

- **WHEN** the visitor removes a visible company from favorites
- **THEN** that company's marker drops the favorite mark without a page reload

