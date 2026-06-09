# axis-info-pages Specification

## Purpose

The five per-axis explanation pages: a static, bilingual reading page for each axis (substance, ecology, power, embeddedness, posture) describing in plain first-person prose what the axis means, what moves a company on it, and how a silent website is read — with origin-aware back navigation, cross-links to the other axes and the philosophy page, footnotes for contestable claims, and a directional reveal.
## Requirements
### Requirement: Routes

Each of the five axes SHALL have a static explanation page, served at `/as/{axisId}/` for Dutch and `/en/axis/{axisId}/` for English, where `axisId` is one of the language-neutral axis IDs `substance`, `ecology`, `power`, `embeddedness`, `posture`. The locale is determined by the route prefix. An unknown `axisId` redirects to the 404 page.

#### Scenario: Dutch axis page at /as

- **WHEN** a visitor opens `/as/{axisId}/` for a known axis
- **THEN** the page renders in Dutch with that axis's explanation

#### Scenario: English axis page under /en/axis

- **WHEN** a visitor opens `/en/axis/{axisId}/` for a known axis
- **THEN** the page renders in English with that axis's explanation

#### Scenario: Unknown axis

- **WHEN** the `axisId` does not match one of the five axis IDs
- **THEN** the visitor is redirected to the 404 page

### Requirement: Page structure

The page SHALL present, in order: a header with the axis's line glyph and its localized label plus a position eyebrow ("as N van 5" / "axis N of 5"); a one-line plain-language lead; and three explanatory sections — what the axis means, what pushes a company up or down, and how a silent website is read. All prose is lowercase and sourced from the active locale.

#### Scenario: Axis header and lead

- **WHEN** an axis page renders
- **THEN** it shows the axis glyph, the localized axis label, an "N of 5" eyebrow, and a one-line plain lead above the three sections

### Requirement: Readability indicator

The page SHALL show how readable the axis is from public text as a three-level mark (high, medium, low) with a short localized phrase, distinct from the per-company evidence levels.

#### Scenario: Readability shown

- **WHEN** an axis page renders
- **THEN** it shows a three-level readability mark with its localized phrase for that axis

### Requirement: Footnotes

Contestable claims in the prose MAY carry footnote markers. The page SHALL render any such markers as tiny numbered links at the end of the paragraph, and activating a marker SHALL move to the matching note in a list at the bottom of the page, where the note links back to the marker. A single paragraph MAY reference more than one note.

#### Scenario: Footnote marker resolves

- **WHEN** a paragraph carries a footnote and the visitor activates its numbered marker
- **THEN** the page moves to the matching note at the bottom, which offers a link back to the marker

### Requirement: Origin-aware back navigation

The page SHALL offer a back control whose target depends on the `from` query parameter. When `from` names a company, the back control SHALL return to that company's detail page (`/{from}/` for Dutch, `/en/{from}/` for English). When `from` is the reserved value `filters`, the back control SHALL return to the map for the current locale with the filter sheet reopened. When `from` is absent, the back control SHALL return to the map.

#### Scenario: Back to the originating company

- **WHEN** the axis page is opened with `?from={company_id}`
- **THEN** the back control points to that company's detail page in the current locale

#### Scenario: Back to the filters

- **WHEN** the axis page is opened with `?from=filters`
- **THEN** the back control points to the map route for the current locale and the map reopens the filter sheet on arrival

#### Scenario: Back to the map by default

- **WHEN** the axis page is opened without a `from` parameter
- **THEN** the back control points to the map route for the current locale

### Requirement: Cross navigation

The page SHALL offer links to the other four axes' info pages and a link to the philosophy page. It SHALL also show the standing project disclaimer.

#### Scenario: Links to the other axes

- **WHEN** an axis page renders
- **THEN** it lists the other four axes, each linking to its own info page in the current locale
- **AND** it offers a link to the philosophy page

### Requirement: Reveal transition

On load the page SHALL play a directional paper-bloom reveal sweeping diagonally from the lower-left toward the upper-right, in the site's bloom-curtain idiom. Under a reduced-motion preference the reveal SHALL be suppressed and the page shown directly.

#### Scenario: Reduced motion

- **WHEN** the visitor prefers reduced motion
- **THEN** the page renders without the bloom reveal and remains fully usable

