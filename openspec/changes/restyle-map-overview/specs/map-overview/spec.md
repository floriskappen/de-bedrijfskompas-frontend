## MODIFIED Requirements

### Requirement: Pin rendering

Every renderable company MUST appear as exactly one pin at its `latlng`. All pins SHALL render in the same uniform style — an ink dot with a thin paper-warm outline and a quiet ink halo. Companies whose axis scores are all `null` MUST still render a pin and remain tappable. The currently-selected pin SHALL carry an additional red halo ring distinguishing it from unselected pins.

#### Scenario: Every renderable company has one uniform pin

- **WHEN** the map finishes rendering
- **THEN** every renderable company has exactly one pin and all pins share the same colour, size, and halo

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null`
- **THEN** its pin still renders in the uniform style and opens the peek card on tap

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a pin is the currently-selected pin
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

### Requirement: Peek card content

When a company is selected, a peek card MUST overlay the bottom of the map showing — in order — the company's identity (monogram, name, locality with optional distance), its tagline in the current locale highlighted inside an "in het echt" / "in real life" callout, a pentagon of all five axis scores, a primary "open volledig profiel" / "open full profile" CTA, and an inert bookmark affordance. The card MUST NOT show an explicit close button; selection clears via Escape, tapping outside any pin, or tapping the selected pin again.

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

#### Scenario: No explicit close button

- **WHEN** the peek card is open
- **THEN** no X / close button is rendered; the card clears only via Escape, tapping outside any pin, or tapping the currently-selected pin

## ADDED Requirements

### Requirement: Map chrome

The map experience MUST surface two chrome elements above the basemap: a *filters pill* anchored top-right showing the filters icon and the word "filters" — visually present but inert until the filters capability ships; and a *bottom hint*, vertically anchored above the safe-area bottom and only visible while no pin is selected, reading `{n} bedrijven in beeld · tik een pin` (nl) / `{n} companies in view · tap a pin` (en) where `{n}` is the size of the renderable collection. All chrome (filters pill, language switcher, bottom hint) SHALL share one visual idiom: sharp corners, paper background, 1px ink border, mono-uppercase label.

#### Scenario: Filters pill is inert

- **WHEN** a user taps the filters pill
- **THEN** nothing happens (no panel opens, no URL change) — the pill is a placeholder for the future filters capability

#### Scenario: Bottom hint reflects renderable count and hides on selection

- **WHEN** the page renders with N renderable companies and no `?selected`
- **THEN** the bottom hint reads "N bedrijven in beeld · tik een pin" (nl) / "N companies in view · tap a pin" (en)

#### Scenario: Bottom hint hides while a pin is selected

- **WHEN** a pin is selected (peek card is open)
- **THEN** the bottom hint is not visible

### Requirement: Visual design system

The map page MUST render on the de-ontwerp visual identity: the paper palette (paper `#F1ECE0`, paper-warm `#ECE4D2`, paper-deep `#E4DBC4`), the ink scale (ink `#1F1B16`, ink-soft, ink-quiet, ink-faint), a single red accent (`#B84A39`), Archivo as the sans family and JetBrains Mono as the monospace family. User-visible body copy SHALL render lowercase, with one exception: proper-name strings sourced from the company data contract (notably `company.name` and the monogram derived from it) SHALL preserve their source casing. Mono-family labels SHALL render uppercase as utility marks with visible letter-tracking. The peek card and body background SHALL carry a paper-grain texture; the Mapbox basemap canvas is exempt.

#### Scenario: Body copy renders lowercase

- **WHEN** any user-visible text renders outside of a mono utility mark
- **THEN** it appears lowercase regardless of the source string's casing

#### Scenario: Company name preserves source casing

- **WHEN** the peek card renders for a company whose `name` is "Fairphone"
- **THEN** the heading shows "Fairphone" and the monogram square shows "F" (not lowercased)

#### Scenario: Mono utility marks render uppercase with tracking

- **WHEN** a label uses the mono family (e.g. the "in het echt" callout label, the bottom hint, axis labels in the pentagon)
- **THEN** it appears uppercase with visible letter-tracking
