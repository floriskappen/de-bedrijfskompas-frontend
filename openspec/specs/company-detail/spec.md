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

The page SHALL present the company identity using the same treatment as the map peek card: a square ink monogram tile showing the first letter of the company name (preserving source casing), the company name, a location line, and the company's plain-text tagline.

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

The page SHALL list the five axes — in the fixed order `substance`, `ecology`, `power`, `embeddedness`, `posture` — using the site's axis labels (`inhoud`, `ecologie`, `macht`, `verankering`, `houding` in Dutch). Each collapsed axis row SHALL show the axis's focus level (`low`, `medium`, or `high`) as a compact three-bar focus meter — one filled bar for `low`, two for `medium`, three for `high` — carrying the localized level label as its accessible name. An axis with a `null` score or `no_signal` evidence SHALL instead show the no-signal meter (all three bars hollow) and read as "geen signaal". The same focus meter SHALL be the shared focus-level indicator used on the favorites cards and as the selected minimum in the filter sheet. Each axis row SHALL be tappable to expand, revealing the axis's evidence level and the localized reasoning prose for why it scored as it did.

#### Scenario: Collapsed row shows the focus level

- **WHEN** an axis has a numeric score
- **THEN** its collapsed row shows that axis's focus level as a focus meter whose filled-bar count matches the band (`low`/`medium`/`high`) and whose accessible name is the localized level label

#### Scenario: No-signal row shows the unknown state

- **WHEN** an axis has a `null` score or `no_signal` evidence
- **THEN** its collapsed row shows the hollow no-signal meter labelled "geen signaal" instead of a focus level, and the row is visibly de-emphasized

#### Scenario: Expand an axis

- **WHEN** the visitor taps an axis row
- **THEN** the row expands to show the axis's evidence level and its localized `reason` text
- **AND** any previously expanded row's behaviour is consistent (at least the tapped row's content becomes visible)

#### Scenario: Evidence level shown inside the expanded row

- **WHEN** an expanded axis row renders its evidence
- **THEN** it displays the axis's `evidence` value (`well_evidenced`, `partial`, or `no_signal`) as a localized, lowercase label with its glyph, within the expanded panel rather than on the collapsed row

#### Scenario: Missing reason text

- **WHEN** an axis's `reason` is empty in both locales
- **THEN** the expanded row shows the evidence only, without an empty prose block

### Requirement: Axis info-page links

Each expanded axis SHALL offer a link to that axis's info page, targeting `/as/{axisId}/` for Dutch and `/en/axis/{axisId}/` for English, keyed by the language-neutral axis ID. The link SHALL carry the current company's id as a `from` query parameter so the info page can offer a way back to this company.

#### Scenario: Axis link target

- **WHEN** an axis row is expanded on the Dutch page
- **THEN** it shows an info link pointing to `/as/{axisId}/?from={company_id}` for that axis
- **AND** on the English page the link points to `/en/axis/{axisId}/?from={company_id}`

### Requirement: Top bar

The page SHALL carry a top bar with an origin-aware back control, plus quiet icon affordances for toggling the current company as a favorite and, when present, opening its website. By default — and when reached from the map peek card — the back control SHALL return to the map for the current locale with this company selected, so the map re-opens the peek card it was reached from. When the detail page is reached from the favorites overview (signalled by a `from=favorites` origin marker on the URL), the back control SHALL instead return to the localized favorites overview page and carry the localized "back to favorites" label. The favorite control SHALL reflect whether the current company is saved in browser-local favorites and SHALL toggle that state without navigating.

#### Scenario: Back to the map keeps the company selected

- **WHEN** the visitor reached the detail page from the map and activates the back control
- **THEN** they return to the map for the current locale with this company selected and its peek card re-opened

#### Scenario: Back to favorites when reached from the overview

- **WHEN** the visitor opened the detail page from the favorites overview (a `from=favorites` origin)
- **THEN** the back control returns to the localized favorites overview page rather than the map

#### Scenario: Favorite control reflects saved state

- **WHEN** the company is saved in browser-local favorites
- **THEN** the detail-page favorite control shows selected state

#### Scenario: Favorite control toggles without navigation

- **WHEN** the visitor activates the detail-page favorite control
- **THEN** the current company favorite state changes
- **AND** the visitor remains on the detail page

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

### Requirement: Last-checked footer

The detail page SHALL close with a quiet footer line stating when the company's data was last refreshed, derived from the record's `updated_at` timestamp and rendered as a localized relative time (Dutch on `/{company_id}/`, English on `/en/{company_id}/`). When the record carries no `updated_at`, the footer SHALL be omitted rather than showing a fabricated or fixed date.

#### Scenario: Footer reflects the real timestamp

- **WHEN** the page renders for a company with an `updated_at` timestamp
- **THEN** the footer shows a localized "last checked" line whose relative time is computed from that timestamp

#### Scenario: Localized relative time

- **WHEN** the footer renders on the Dutch route versus the English route
- **THEN** the relative time and surrounding copy read in that route's language, in lowercase

#### Scenario: No timestamp present

- **WHEN** the company record has no `updated_at`
- **THEN** no last-checked footer line is shown

