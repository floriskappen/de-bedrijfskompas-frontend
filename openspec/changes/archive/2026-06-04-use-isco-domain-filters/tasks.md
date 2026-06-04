## 1. Data Contract

- [x] 1.1 Replace the `CapabilityTag` type with `isco_code`, `prominence`, and optional `confidence`.
- [x] 1.2 Add ISCO sub-major validation and a complete projection table covering all 43 sub-major groups.
- [x] 1.3 Add minor-code projection overrides for mixed ISCO groups such as design, cultural, sales, care, and legal roles.
- [x] 1.4 Update `validate()` to reject malformed `isco_code`, unknown prominence, and unknown confidence.
- [x] 1.5 Verify with unit tests: `known ISCO tags are projected to work fields`, `unknown ISCO tags are rejected`, `unknown confidence is rejected`, `sub-major projection is complete`, and `tags are locale-neutral`.

## 2. Map Filtering

- [x] 2.1 Replace selected tag filter state with selected projected work-field state.
- [x] 2.2 Update filter predicates so selected work fields use AND semantics over projected company work fields.
- [x] 2.3 Update work-field counts so counts exclude the facet currently being counted and preserve existing axis histogram behavior.
- [x] 2.4 Update filter chips to render localized work-field labels and `data-domain-filter` attributes.
- [x] 2.5 Verify with tests: `domain filters combine with AND semantics`, `counts update with other active filters`, `reset clears active filters`, `work-field counts update with active filters`, and `no work-field data shows empty work-field section`.

## 3. Data Refresh And Compatibility

- [x] 3.1 Fetch the latest pipeline `companies.json` release and confirm it uses `capability_tags[].isco_code`.
- [x] 3.2 Ensure renderable company loading still drops invalid coordinate/status records and treats omitted tags as empty.
- [x] 3.3 Ensure `/test-no-tags` still strips capability tags and exercises the empty work-field state.

## 4. Documentation And Verification

- [x] 4.1 Update labels/messages for localized work-field copy while preserving lowercase user-facing copy.
- [x] 4.2 Run unit tests for company data and filter helpers.
- [x] 4.3 Run broader project validation (`npm test` plus targeted Playwright); `astro check` still reports pre-existing missing Node types.
- [x] 4.4 Confirm OpenSpec status is apply-ready for `use-isco-domain-filters`.
