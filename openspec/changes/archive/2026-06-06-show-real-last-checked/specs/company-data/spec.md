## MODIFIED Requirements

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
