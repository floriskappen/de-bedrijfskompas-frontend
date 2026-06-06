## ADDED Requirements

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
