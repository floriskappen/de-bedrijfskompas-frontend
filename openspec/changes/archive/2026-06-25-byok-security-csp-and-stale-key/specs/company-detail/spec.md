## MODIFIED Requirements

### Requirement: Identity header

The page SHALL present the company identity using the same treatment as the map peek card: a square ink monogram tile showing the first letter of the company name (preserving source casing), the company name, a location line, and the company's plain-text tagline.

#### Scenario: Location line

- **WHEN** the page renders the location line
- **THEN** it shows the company's city, falling back to a generic "unknown location" label when the city is absent
- **AND** it appends `· {n} km` only when the visitor's distance to the company is known

#### Scenario: Tagline

- **WHEN** the page renders the tagline
- **THEN** it shows the localized `tagline`, falling back to the other locale and then to a generic "no description" label when absent
