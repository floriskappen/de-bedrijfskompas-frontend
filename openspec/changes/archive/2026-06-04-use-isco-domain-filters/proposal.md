## Why

The pipeline now emits `capability_tags` as ISCO-08 minor occupation codes rather than the frontend's earlier hand-made family slugs. The map filters need to stay intuitive for users, so the frontend should consume the canonical ISCO spine while projecting those codes into clearer work-field chips.

## What Changes

- **BREAKING** replace the `capability_tags[].family` frontend contract with `capability_tags[].isco_code`, keeping `prominence` and accepting optional `confidence`.
- Validate ISCO minor codes by deriving their two-digit ISCO sub-major group and rejecting unknown or malformed codes.
- Add a frontend projection from ISCO minor codes to custom work fields such as software/it, health/care, sales, education, and production/logistics.
- Ensure every one of the 43 ISCO sub-major groups maps to at least one custom work field, with minor-level overrides for mixed groups.
- Replace map tag chips/counts/filter state with projected work-field chips while preserving AND semantics across selected fields.
- Fetch and consume the latest `companies.json` release shape from the pipeline.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `company-data`: company tag validation and normalized access move from family slugs to ISCO minor-code tags plus projected work fields.
- `map-overview`: the filter panel presents and filters by projected work fields instead of old capability family tags.

## Impact

- Affects the external pipeline/frontend JSON contract for `capability_tags`.
- Updates `src/lib/company-data/*`, filter labels, map filter state, and related unit/E2E tests.
- No new runtime dependencies.
