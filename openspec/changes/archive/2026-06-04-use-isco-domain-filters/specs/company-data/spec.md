## MODIFIED Requirements

### Requirement: Company record shape

A company record represents one organization being evaluated by the project. Every record MUST contain the top-level fields `company_id` (stable kebab/snake slug used in URLs), `name`, `status`, `latlng`, and `scores`. `website`, `address`, and `capability_tags` are optional. When present, `capability_tags` MUST be an array of zero or more objects with `isco_code` set to a supported three-digit ISCO-08 minor group code, `prominence` set to `core`, `supporting`, or `incidental`, and optional `confidence` set to `high` or `low`; when absent, consumers MUST treat it as an empty array. Each supported locale (`nl`, `en`) appears as a top-level key containing locale-specific prose. The set of axis identifiers in `scores` is fixed and exhaustive: `substance`, `ecology`, `power`, `embeddedness`, `posture`.

#### Scenario: Valid record is exposed to the app

- **WHEN** the frontend loads a JSON record matching the contract
- **THEN** the typed record is available through the access primitive

#### Scenario: Record missing a required field is dropped

- **WHEN** a JSON record lacks any of `company_id`, `name`, `status`, `latlng`, or `scores`
- **THEN** the record is omitted from the collection and a build-time warning is emitted

#### Scenario: Missing tags behave as empty tags

- **WHEN** a JSON record omits `capability_tags`
- **THEN** the typed record remains renderable and consumers expose its projected work fields as an empty array

### Requirement: Company tag taxonomy

Company capability tags MUST use ISCO-08 minor occupation codes as locale-neutral source identifiers. The frontend MUST accept three-digit `isco_code` values whose two-digit sub-major prefix is one of `11`, `12`, `13`, `14`, `21`, `22`, `23`, `24`, `25`, `26`, `31`, `32`, `33`, `34`, `35`, `41`, `42`, `43`, `44`, `51`, `52`, `53`, `54`, `61`, `62`, `63`, `71`, `72`, `73`, `74`, `75`, `81`, `82`, `83`, `91`, `92`, `93`, `94`, `95`, `96`, `01`, `02`, and `03`. Every supported sub-major group MUST project to at least one frontend work-field identifier from `education-training`, `health-care`, `engineering-technical`, `software-it`, `science-research`, `business-finance-admin`, `sales-commercial`, `creative-media-culture`, `legal-policy`, `trades-construction`, `production-logistics`, `agriculture-environment`, `hospitality-personal-service`, `management-leadership`, and `public-safety-defense`.

#### Scenario: Known ISCO tags are projected

- **WHEN** a record has `capability_tags: [{ "isco_code": "251", "prominence": "core", "confidence": "high" }, { "isco_code": "243", "prominence": "supporting", "confidence": "low" }]`
- **THEN** the record is valid and consumers expose projected work fields including `software-it` and `sales-commercial`

#### Scenario: Unknown ISCO tag is rejected

- **WHEN** a record has a capability tag whose `isco_code` is malformed or whose two-digit prefix is outside the supported ISCO sub-major set
- **THEN** the record is omitted from the collection and a build-time warning identifies the invalid `isco_code`

#### Scenario: Unknown prominence is rejected

- **WHEN** a record has a capability tag prominence outside `core`, `supporting`, or `incidental`
- **THEN** the record is omitted from the collection and a build-time warning identifies the invalid prominence

#### Scenario: Unknown confidence is rejected

- **WHEN** a record has a capability tag confidence outside `high` or `low`
- **THEN** the record is omitted from the collection and a build-time warning identifies the invalid confidence

#### Scenario: Sub-major projection is complete

- **WHEN** the frontend projection table is loaded
- **THEN** every one of the 43 supported ISCO sub-major groups maps to at least one frontend work-field identifier

#### Scenario: Tags are locale-neutral

- **WHEN** a record is rendered on `/` and `/en/`
- **THEN** the same `isco_code`, `prominence`, `confidence`, and projected work-field identifiers are used on both routes while UI labels may be localized by the frontend
