# company-detail Specification

## Purpose
TBD - created by archiving change build-company-detail-page. Update Purpose after archive.
## Requirements
### Requirement: Routes

The company detail page SHALL be served statically at `/{company_id}/` for Dutch and `/en/{company_id}/` for English, with one page generated per company exposed by the data layer. The locale is determined by the route prefix.

#### Scenario: Dutch route at root

- **WHEN** a visitor opens `/{company_id}/` for a known company
- **THEN** the page renders in Dutch with that company's profile

#### Scenario: English route under /en

- **WHEN** a visitor opens `/en/{company_id}/` for a known company
- **THEN** the page renders in English with that company's profile

#### Scenario: Unknown company

- **WHEN** the `company_id` does not match any company exposed by the data layer
- **THEN** the visitor is redirected to the 404 page

### Requirement: Identity header

The page SHALL present the company identity using the same treatment as the map peek card: a favicon thumbnail (falling back to a monogram of the first letter when no favicon is available or it fails to load), the company name, a location line, and the company's plain-text tagline.

#### Scenario: Favicon available

- **WHEN** the company has a `favicon_url` that loads
- **THEN** the favicon is shown in the identity thumbnail

#### Scenario: Favicon missing or fails

- **WHEN** the company has no `favicon_url`, or the image fails to load
- **THEN** a monogram of the company name's first letter is shown instead

#### Scenario: Location line

- **WHEN** the page renders the location line
- **THEN** it shows the company's city, falling back to a generic "unknown location" label when the city is absent
- **AND** it appends `· {n} km` only when the visitor's distance to the company is known

#### Scenario: Tagline

- **WHEN** the page renders the tagline
- **THEN** it shows the localized `tagline`, falling back to the other locale and then to a generic "no description" label when absent

### Requirement: Pentagon overview

The page SHALL render the five-axis pentagon for the company, in the same visual form used elsewhere in the app, using the company's per-axis scores.

#### Scenario: Scored axes

- **WHEN** an axis has a numeric score
- **THEN** the pentagon plots that axis at its score

#### Scenario: Null-score axis

- **WHEN** an axis has a `null` score (no signal)
- **THEN** the pentagon marks that axis as unknown rather than plotting it as zero or erroring

### Requirement: Axis reasoning list

The page SHALL list the five axes — in the fixed order `substance`, `ecology`, `power`, `embeddedness`, `posture` — using the site's axis labels (`inhoud`, `ecologie`, `macht`, `verankering`, `houding` in Dutch). Each axis row SHALL be tappable to expand, revealing that axis's evidence level and the localized reasoning prose for why it scored as it did.

#### Scenario: Expand an axis

- **WHEN** the visitor taps an axis row
- **THEN** the row expands to show the axis's evidence level and its localized `reason` text
- **AND** any previously expanded row's behaviour is consistent (at least the tapped row's content becomes visible)

#### Scenario: Evidence level shown

- **WHEN** an expanded axis row renders its evidence
- **THEN** it displays the axis's `evidence` value (`well_evidenced`, `partial`, or `no_signal`) as a localized, lowercase label with its glyph

#### Scenario: No-signal axis row

- **WHEN** an axis has `no_signal` evidence (and/or a `null` score)
- **THEN** the row is visibly de-emphasized and still shows its `reason` text when one is present

#### Scenario: Missing reason text

- **WHEN** an axis's `reason` is empty in both locales
- **THEN** the expanded row shows the label and evidence only, without an empty prose block

### Requirement: Axis info-page links

Each expanded axis SHALL offer a link to that axis's info page, targeting `/as/{axisId}/` for Dutch and `/en/axis/{axisId}/` for English, keyed by the language-neutral axis ID. The link SHALL carry the current company's id as a `from` query parameter so the info page can offer a way back to this company.

#### Scenario: Axis link target

- **WHEN** an axis row is expanded on the Dutch page
- **THEN** it shows an info link pointing to `/as/{axisId}/?from={company_id}` for that axis
- **AND** on the English page the link points to `/en/axis/{axisId}/?from={company_id}`

### Requirement: Top bar

The page SHALL carry a top bar with a back control that returns to the map, plus quiet icon affordances for saving the company and (when present) opening its website. The back control SHALL preserve the company selection so the map re-opens the peek card it was reached from.

#### Scenario: Back to the map keeps the company selected

- **WHEN** the visitor activates the back control
- **THEN** they return to the map for the current locale with this company selected (its peek card re-opened)

#### Scenario: Website affordance present

- **WHEN** the company has a `website`
- **THEN** the top bar shows a control that opens that URL in a new tab

#### Scenario: Website affordance absent

- **WHEN** the company has no `website`
- **THEN** no website control is shown

### Requirement: Page surface

The detail page background SHALL use the same warm grained surface as the map peek card — the filter surface colour beneath the shared paper-grain texture — so the peek card and the detail page it opens into read as one continuous sheet. The surface SHALL apply on both the Dutch (`/{company_id}/`) and English (`/en/{company_id}/`) routes.

#### Scenario: Detail background matches the peek card surface

- **WHEN** the detail page renders for either locale
- **THEN** its page background uses the same surface colour and paper-grain texture as the map peek card

