## MODIFIED Requirements

### Requirement: Company record shape

A company record represents one organization being evaluated by the project. Every record MUST contain the top-level fields `company_id` (stable kebab/snake slug used in URLs), `name`, `status`, `latlng`, and `scores`. `website`, `address`, and `capability_tags` are optional. When present, `capability_tags` MUST be an array of zero or more objects with `family` set to a supported tag taxonomy identifier and `prominence` set to `core`, `supporting`, or `incidental`; when absent, consumers MUST treat it as an empty array. Each supported locale (`nl`, `en`) appears as a top-level key containing locale-specific prose. The set of axis identifiers in `scores` is fixed and exhaustive: `substance`, `ecology`, `power`, `embeddedness`, `posture`.

#### Scenario: Valid record is exposed to the app

- **WHEN** the frontend loads a JSON record matching the contract
- **THEN** the typed record is available through the access primitive

#### Scenario: Record missing a required field is dropped

- **WHEN** a JSON record lacks any of `company_id`, `name`, `status`, `latlng`, or `scores`
- **THEN** the record is omitted from the collection and a build-time warning is emitted

#### Scenario: Missing tags behave as empty tags

- **WHEN** a JSON record omits `capability_tags`
- **THEN** the typed record remains renderable and consumers expose its tags as an empty array

### Requirement: Company tag taxonomy

Company capability tag families MUST use the fixed identifiers `software-engineering`, `data-ai`, `hardware-electronics`, `mechanical-civil-engineering`, `life-sciences`, `earth-environmental-sciences`, `clinical-care`, `design-creative`, `content-media`, `commercial`, `finance-accounting`, `legal-compliance`, `policy-public-administration`, `operations-supply-chain`, `people-org`, `field-trades-operators`, `education-training`, `service-hospitality`, and `community-social`. Tag family identifiers and prominence values are locale-neutral and MUST NOT be translated in the JSON data.

#### Scenario: Known tags are preserved

- **WHEN** a record has `capability_tags: [{ "family": "software-engineering", "prominence": "core" }, { "family": "commercial", "prominence": "supporting" }]`
- **THEN** both tag families are exposed to map consumers in source order

#### Scenario: Unknown tags are rejected

- **WHEN** a record has a tag identifier outside the supported taxonomy
- **THEN** the record is omitted from the collection and a build-time warning identifies the invalid tag

#### Scenario: Unknown prominence is rejected

- **WHEN** a record has a capability tag prominence outside `core`, `supporting`, or `incidental`
- **THEN** the record is omitted from the collection and a build-time warning identifies the invalid prominence

#### Scenario: Tags are locale-neutral

- **WHEN** a record is rendered on `/` and `/en/`
- **THEN** the same tag identifiers are used on both routes while UI labels may be localized by the frontend
