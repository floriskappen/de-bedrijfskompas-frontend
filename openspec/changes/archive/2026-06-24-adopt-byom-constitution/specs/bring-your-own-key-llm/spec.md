## ADDED Requirements

### Requirement: Constitution conformance
The browser-local LLM access capability SHALL conform to the BYOM constitution pinned at `vendor/byom`, with the capability's compliance state and any deviations recorded in `BYOM-INTEGRATION.md` at the repository root.

#### Scenario: Conformance is recorded against a pinned constitution
- **WHEN** the BYOK capability's conformance is reviewed
- **THEN** `BYOM-INTEGRATION.md` names the pinned constitution version and records the capability's current deviations from the constitution's security invariants
