## ADDED Requirements

### Requirement: Company record shape

A company record represents one organization being evaluated by the project. Every record MUST contain the top-level fields `company_id` (stable kebab/snake slug used in URLs), `name`, `status`, `coords`, and `scores`. `website` and `address` are optional. Each supported locale (`nl`, `en`) appears as a top-level key containing locale-specific prose. The set of axis identifiers in `scores` is fixed and exhaustive: `substance`, `ecology`, `power`, `embeddedness`, `posture`.

#### Scenario: Valid record is exposed to the app

- **WHEN** the frontend loads a JSON record matching the contract
- **THEN** the typed record is available through the access primitive

#### Scenario: Record missing a required field is dropped

- **WHEN** a JSON record lacks any of `company_id`, `name`, `status`, `coords`, or `scores`
- **THEN** the record is omitted from the collection and a build-time warning is emitted

### Requirement: Axis score and null semantics

Each axis in `scores` has a `score` and an `evidence` value. `score` is an integer in `[0, 100]` or `null`. A `null` score means "no signal found", not zero, and MUST be rendered as a distinct state from `score: 0`. `evidence` is one of `well_evidenced`, `partial`, `no_signal`. The combination `(score: null, evidence: <anything>)` is the canonical "we don't know" state.

#### Scenario: Null score is preserved, not coerced

- **WHEN** a company has `scores.power.score: null`
- **THEN** the company is included in the collection and the power axis is exposed to consumers as "no signal", distinct from `score: 0`

### Requirement: Coordinates are required and validated

Every renderable company MUST have `coords: { lat, lng }` with `lat` in `[-90, 90]` and `lng` in `[-180, 180]`. Records with missing or out-of-range coordinates are not renderable.

#### Scenario: Invalid coordinates exclude the record

- **WHEN** a record has `coords: null` or values outside the valid ranges
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

## Operational Pitfalls

- **Source format is private to this capability.** Consumers MUST go through the access primitive, never read raw data files. Reading raw files bypasses renderability filtering and locale-fallback rules and will silently misbehave when the source switches from JSON to SQLite.
- **Locale fallback is one-step, between `nl` and `en` only.** If the broader project later adds a third locale, the fallback chain has to be redesigned — the current "missing → the other one" rule does not generalize.
