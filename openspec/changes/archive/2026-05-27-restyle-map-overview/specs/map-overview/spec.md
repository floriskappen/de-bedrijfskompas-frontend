## MODIFIED Requirements

### Requirement: Pin rendering

Every renderable company MUST appear as exactly one pin at its `latlng`. All pins SHALL render in the same uniform style — an ink dot with a thin paper-warm outline and a quiet ink halo. Companies whose axis scores are all `null` MUST still render a pin and remain tappable. The currently-selected pin SHALL carry an additional red halo ring. When two or more companies share the same `latlng`, their pins MUST fan out on a small, deterministic pixel-space rosette around the shared point so each pin stays individually visible and tappable regardless of how many are collocated.

#### Scenario: Every renderable company has one uniform pin

- **WHEN** the map finishes rendering
- **THEN** every renderable company has exactly one pin and all pins share the same colour, size, and halo

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null`
- **THEN** its pin still renders in the uniform style and opens the peek card on tap

#### Scenario: Collocated companies fan out

- **WHEN** two or more companies share the same `latlng`
- **THEN** each pin is offset on a small rosette around the shared point so the pins do not overlap and every one can be tapped individually

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a pin is the currently-selected pin
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

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

## ADDED Requirements

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
