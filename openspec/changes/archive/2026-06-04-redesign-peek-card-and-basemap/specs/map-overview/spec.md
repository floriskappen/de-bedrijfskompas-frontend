## MODIFIED Requirements

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

### Requirement: Visual design system

The map page MUST render on the de-ontwerp visual identity: the active skin's paper surfaces, ink scale, and single red accent, Archivo as the sans family and JetBrains Mono as the monospace family. User-visible body copy SHALL render lowercase, with one exception: proper-name strings sourced from the company data contract (notably `company.name` and the monogram derived from it) SHALL preserve their source casing. Mono-family labels SHALL render uppercase as utility marks with visible letter-tracking. The peek card and body background SHALL carry a paper-grain texture; the Mapbox basemap canvas is exempt.

#### Scenario: Body copy renders lowercase, proper names keep source casing

- **WHEN** user-visible text renders outside of a mono utility mark
- **THEN** it appears lowercase regardless of the source string's casing; but a company `name` like "Fairphone" and its monogram "F" preserve source casing

#### Scenario: Mono utility marks render uppercase with tracking

- **WHEN** a label uses the mono family (e.g. the axis labels in the pentagon)
- **THEN** it appears uppercase with visible letter-tracking

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
