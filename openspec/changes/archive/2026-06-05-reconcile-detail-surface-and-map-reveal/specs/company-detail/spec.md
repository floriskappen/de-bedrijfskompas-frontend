## ADDED Requirements

### Requirement: Page surface

The detail page background SHALL use the same warm grained surface as the map peek card — the filter surface colour beneath the shared paper-grain texture — so the peek card and the detail page it opens into read as one continuous sheet. The surface SHALL apply on both the Dutch (`/{company_id}/`) and English (`/en/{company_id}/`) routes.

#### Scenario: Detail background matches the peek card surface

- **WHEN** the detail page renders for either locale
- **THEN** its page background uses the same surface colour and paper-grain texture as the map peek card
