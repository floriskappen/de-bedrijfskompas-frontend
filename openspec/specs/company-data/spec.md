# Company Data

## Purpose

Capability to load, validate, and access company records.
## Requirements
### Requirement: Company record shape

A company record represents one organization being evaluated by the project. Every record MUST contain the top-level fields `company_id` (stable kebab/snake slug used in URLs), `name`, `status`, `latlng`, and `scores`. `website`, `address`, `capability_tags`, `created_at`, and `updated_at` are optional. When present, `created_at` and `updated_at` MUST be ISO 8601 timestamp strings (UTC) marking when the record was first produced and last refreshed by the pipeline; consumers MUST treat them as opaque pass-through values and tolerate their absence. When present, `capability_tags` MUST be an array of zero or more objects with `isco_code` set to a supported three-digit ISCO-08 minor group code, `prominence` set to `core`, `supporting`, or `incidental`, and optional `confidence` set to `high` or `low`; when absent, consumers MUST treat it as an empty array. Each supported locale (`nl`, `en`) appears as a top-level key containing locale-specific prose. The set of axis identifiers in `scores` is fixed and exhaustive: `substance`, `ecology`, `power`, `embeddedness`, `posture`.

#### Scenario: Valid record is exposed to the app

- **WHEN** the frontend loads a JSON record matching the contract
- **THEN** the typed record is available through the access primitive

#### Scenario: Record missing a required field is dropped

- **WHEN** a JSON record lacks any of `company_id`, `name`, `status`, `latlng`, or `scores`
- **THEN** the record is omitted from the collection and a build-time warning is emitted

#### Scenario: Missing tags behave as empty tags

- **WHEN** a JSON record omits `capability_tags`
- **THEN** the typed record remains renderable and consumers expose its projected work fields as an empty array

#### Scenario: Timestamps pass through when present

- **WHEN** a JSON record carries `created_at` and/or `updated_at`
- **THEN** the typed record exposes those ISO 8601 strings unchanged

#### Scenario: Missing timestamps are tolerated

- **WHEN** a JSON record omits `created_at` and `updated_at`
- **THEN** the record remains renderable and consumers treat the timestamps as absent

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

### Requirement: Axis score and null semantics

Each axis in `scores` has a `score` and an `evidence` value. `score` is an integer in `[0, 100]` or `null`. A `null` score means "no signal found", not zero, and MUST be rendered as a distinct state from `score: 0`. `evidence` is one of `well_evidenced`, `partial`, `no_signal`. The combination `(score: null, evidence: <anything>)` is the canonical "we don't know" state.

#### Scenario: Null score is preserved, not coerced

- **WHEN** a company has `scores.power.score: null`
- **THEN** the company is included in the collection and the power axis is exposed to consumers as "no signal", distinct from `score: 0`

### Requirement: Coordinates are required and validated

Every renderable company MUST have `latlng: { lat, lng }` with `lat` in `[-90, 90]` and `lng` in `[-180, 180]`. Records with missing or out-of-range coordinates are not renderable.

#### Scenario: Invalid coordinates exclude the record

- **WHEN** a record has `latlng: null` or values outside the valid ranges
- **THEN** the record is dropped from the collection with a build-time warning

### Requirement: Renderability is determined by status

The `status` field is a string. Only records with `status: "ok"` are renderable; the access primitive MUST omit any record whose status is not `"ok"`. Non-`ok` values are reserved for the pipeline's internal book-keeping (e.g. failed extractions) and SHALL NOT surface to routes.

#### Scenario: Non-ok records do not reach consumers

- **WHEN** a record has `status: "failed"` or any value other than `"ok"`
- **THEN** the record is absent from the collection consumed by routes

### Requirement: i18n prose blocks

Each supported locale appears as a top-level key on the record. A locale block contains `tagline` (string) and, under `scores[<axis>]`, a `reason` (string) per axis. All other fields, including numeric scores and evidence categories, are locale-neutral and MUST NOT be duplicated inside locale blocks.

#### Scenario: Score values are not duplicated in locale blocks

- **WHEN** a record's `nl.scores.substance` or `en.scores.substance` is read
- **THEN** only `reason` is present; numeric `score` and `evidence` live solely under the top-level `scores`

### Requirement: Locale selection with fallback

For a given runtime locale, the frontend SHALL render prose from that locale's block. When the requested locale's value for a field is missing or empty, the frontend MUST fall back to the other supported locale rather than rendering an empty string.

#### Scenario: Missing translation falls back

- **WHEN** a page in `en` renders a tagline and `record.en.tagline` is absent or empty
- **THEN** the page renders `record.nl.tagline`

### Requirement: Build-time access primitive

The capability exposes two build-time accessors: one that returns the collection of all renderable companies, and one that returns a single company by `company_id` or `undefined`. These accessors are the only contract surface; the underlying source format (mock JSON now, SQLite later) is private to this capability and MUST NOT be read directly by consumers.

#### Scenario: Collection accessor returns only renderable companies

- **WHEN** the collection accessor runs at build time
- **THEN** it returns every record that satisfies status, coordinate, and shape constraints, with all other records omitted

#### Scenario: Lookup by id resolves to a record or undefined

- **WHEN** the lookup accessor is called with `company_id`
- **THEN** it returns the matching record if known and renderable, or `undefined` otherwise

