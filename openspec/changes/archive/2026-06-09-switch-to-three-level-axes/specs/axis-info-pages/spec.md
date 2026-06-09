## MODIFIED Requirements

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
