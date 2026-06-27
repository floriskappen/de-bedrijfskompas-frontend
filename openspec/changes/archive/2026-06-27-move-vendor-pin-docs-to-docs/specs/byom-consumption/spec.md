## MODIFIED Requirements

### Requirement: Pinned constitution bundle
The app SHALL consume the BYOM constitution as a git submodule at `vendor/byom`, pinned to a released version tag's commit SHA (not a branch). The vendored bundle, not the upstream development repository, SHALL be the constitution authority available inside this app; `vendor/byom/website/` is movement-facing and is not part of the consumed authority.

#### Scenario: Constitution is vendored as a release bundle
- **WHEN** the repository is checked out with submodules
- **THEN** `vendor/byom/AGENTS.md`, `vendor/byom/VERSION`, `vendor/byom/CHANGELOG.md`, and `vendor/byom/constitution/` are available

#### Scenario: Pin uses an exact release
- **WHEN** the constitution submodule is inspected
- **THEN** it points to a concrete commit tagged `v1.1.0` rather than an unpinned floating working tree or branch tip

### Requirement: Local integration document
The app SHALL maintain `BYOM-INTEGRATION.md` (conventionally at `docs/BYOM-INTEGRATION.md`; the repository root remains an acceptable alternative), authored by following `vendor/byom/constitution/05-integration-guide.md`. It SHALL record the pinned constitution version and commit, the app's model-powered features and their model categories, key handling and CSP posture, spend and budget UI, budget-exhaustion behavior, a per-invariant conformance mapping, current deviations with reasons, and a propagation log of constitution advances.

#### Scenario: Integration document records the current pin
- **WHEN** `docs/BYOM-INTEGRATION.md` is opened
- **THEN** it names BYOM as the constitution, records the pinned version `v1.1.0` and the pinned submodule commit, and records the app's current deviations from the constitution

#### Scenario: Propagation log records advances
- **WHEN** the app advances the constitution to a new release
- **THEN** `docs/BYOM-INTEGRATION.md` contains a propagation-log entry describing what was re-checked against the changed constitution
