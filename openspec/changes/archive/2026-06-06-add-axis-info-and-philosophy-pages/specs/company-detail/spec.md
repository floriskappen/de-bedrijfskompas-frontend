## MODIFIED Requirements

### Requirement: Axis info-page links

Each expanded axis SHALL offer a link to that axis's info page, targeting `/as/{axisId}/` for Dutch and `/en/axis/{axisId}/` for English, keyed by the language-neutral axis ID. The link SHALL carry the current company's id as a `from` query parameter so the info page can offer a way back to this company.

#### Scenario: Axis link target

- **WHEN** an axis row is expanded on the Dutch page
- **THEN** it shows an info link pointing to `/as/{axisId}/?from={company_id}` for that axis
- **AND** on the English page the link points to `/en/axis/{axisId}/?from={company_id}`
