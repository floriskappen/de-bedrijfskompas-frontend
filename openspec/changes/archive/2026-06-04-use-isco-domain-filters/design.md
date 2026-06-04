## Context

The frontend previously treated `capability_tags` as a small set of hand-made family slugs. The pipeline release now emits ISCO-08 minor occupation codes in the same `capability_tags` array, with `prominence` and optional inference `confidence`. ISCO is canonical and defensible, but its major groups are skill-level oriented rather than intuitive domain filters, so the map needs a frontend projection into clearer work fields.

## Goals / Non-Goals

**Goals:**

- Validate the new pipeline tag shape without accepting arbitrary codes.
- Keep ISCO minor codes as the lowest-level source of truth in company data.
- Derive the two-digit ISCO sub-major group for validation and coverage.
- Project each minor code into one or more localized work-field filter chips.
- Preserve existing filter behavior: active work-field chips combine with AND semantics and update counts.

**Non-Goals:**

- Do not fetch or embed ESCO occupations in the frontend.
- Do not expose raw ISCO major groups as user-facing filters.
- Do not classify companies in the frontend; the pipeline remains responsible for inference.
- Do not redesign the filter sheet beyond replacing its vocabulary.

## Decisions

1. Keep `capability_tags` as the array name and change each item to `{ isco_code, prominence, confidence? }`.
   The alternative was introducing a new `isco_tags` field, but the pipeline already publishes the new shape under `capability_tags` and the concept is still "company capability tags." This is a breaking shape change, so validation must reject the old `family` contract rather than silently mix both models.

2. Validate against ISCO sub-major coverage by deriving the two-digit prefix from a three-digit minor code.
   Listing every minor code in the frontend would be more exact but much heavier and brittle. The app only needs to know whether a minor code belongs to a supported ISCO sub-major group, while the pipeline owns the fine-grained classification.

3. Store the projection in a shared company-data helper, not inside the React component.
   Filter predicates, counts, labels, and tests all need the same interpretation of `isco_code`. Keeping the mapping in the data layer avoids divergent UI-only logic and lets unit tests prove coverage across all 43 sub-major groups.

4. Use sub-major projection as the complete fallback and minor-level overrides for mixed sub-major groups.
   Some sub-major groups, notably `26` and `34`, contain legal, social, cultural, education, and care roles. Minor overrides keep current companies from being over-broadly tagged while the sub-major fallback ensures future valid codes still surface in at least one work field.

5. Keep selected work fields in component state and E2E hooks as `selectedDomains`.
   Reusing `selectedTags` would hide the vocabulary change and make tests less precise. The route still owns no filter URL state, matching the existing map behavior.

## Risks / Trade-offs

- Pipeline emits a valid ISCO minor code whose mixed sub-major fallback is too broad -> add a minor-level override when the current dataset exposes the ambiguity.
- Domain labels drift from the projection constants -> keep labels keyed by the same `DomainGroupId` union so TypeScript fails on missing labels.
- Future data includes armed-forces or elementary occupation codes not present in the starting Utrecht set -> the all-sub-major coverage test keeps those codes mapped rather than omitted.
- Users may still expect even simpler filters -> the projection can be tuned without changing the pipeline contract because ISCO codes remain canonical underneath.
