# byom-consumption Specification

## Purpose
TBD - created by archiving change adopt-byom-constitution. Update Purpose after archive.
## Requirements
### Requirement: Pinned constitution bundle
The app SHALL consume the BYOM constitution as a git submodule at `vendor/byom`, tracking the `release/v1` branch and checked out to an exact released version commit. The vendored bundle, not the upstream development repository, SHALL be the constitution authority available inside this app; `vendor/byom/website/` is movement-facing and is not part of the consumed authority.

#### Scenario: Constitution is vendored as a release bundle
- **WHEN** the repository is checked out with submodules
- **THEN** `vendor/byom/AGENTS.md`, `vendor/byom/VERSION`, `vendor/byom/CHANGELOG.md`, and `vendor/byom/constitution/` are available

#### Scenario: Pin uses an exact release
- **WHEN** the constitution submodule is inspected
- **THEN** it points to a concrete commit tagged `v1.0.0` rather than an unpinned floating working tree

### Requirement: Local integration document
The app SHALL maintain `BYOM-INTEGRATION.md` at the repository root, authored by following `vendor/byom/constitution/05-integration-guide.md`. It SHALL record the pinned constitution version and commit, the app's model-powered features and their model categories, key handling and CSP posture, spend and budget UI, budget-exhaustion behavior, a per-invariant conformance mapping, current deviations with reasons, and a propagation log of constitution advances.

#### Scenario: Integration document records the current pin
- **WHEN** `BYOM-INTEGRATION.md` is opened
- **THEN** it names BYOM as the constitution, records the pinned version `v1.0.0` and the pinned submodule commit, and records the app's current deviations from the constitution

#### Scenario: Propagation log records advances
- **WHEN** the app advances the constitution to a new release
- **THEN** `BYOM-INTEGRATION.md` contains a propagation-log entry describing what was re-checked against the changed constitution

### Requirement: Agent constitution authority
The repository SHALL provide local agent guidance that directs BYOK and model-powered-feature work to read `vendor/byom/AGENTS.md` first, then `vendor/byom/constitution/02-security-invariants.md` and the chapters relevant to the work. The guidance SHALL require `BYOM-INTEGRATION.md` updates for closed gaps or new deviations.

#### Scenario: BYOK work has a local read path
- **WHEN** an agent starts work on the BYOK layer or a model-powered feature
- **THEN** the repository guidance names `vendor/byom/` as the pinned constitution authority and tells the agent to read `vendor/byom/AGENTS.md` and `constitution/` before editing

### Requirement: Constitution update process
The app SHALL advance the BYOM constitution only through a deliberate pin update. A pin update SHALL read the changelog entries between the old and new versions, re-check each changed constitution chapter against the app, update `BYOM-INTEGRATION.md`'s pinned version and propagation log, and commit the submodule bump with any propagated app changes. The pin SHALL NOT float automatically to the latest commit.

#### Scenario: Release update is propagated deliberately
- **WHEN** the app advances from one constitution release to another
- **THEN** the changelog slice between versions is reviewed, affected constitution chapters are re-checked, and `BYOM-INTEGRATION.md` records the propagation

### Requirement: Content-Security-Policy is enforced
The byom-consumption conformance check SHALL assert that a Content-Security-Policy is present in the production build output, so the constitution's invariant 3 (strict CSP) has an observable, build-time acceptance signal alongside the pin and integration document.

#### Scenario: Built page carries a Content-Security-Policy
- **WHEN** the byom-consumption conformance is reviewed against a built page
- **THEN** the page HTML head contains a `content-security-policy` meta tag whose `default-src` is `'self'` and whose `object-src` is `'none'`

### Requirement: Free and open-source license

The app SHALL be free and open source: no paywall, subscription, or developer-side metering SHALL gate access, and the source SHALL be open under an OSI-approved license. A `LICENSE` file declaring GPL-3.0-or-later SHALL be present at the repository root. This backs `vendor/byom/constitution/05-integration-guide.md` conformance checklist item 1 ("App is free and open source") and `04-badge-and-registry.md` badge eligibility.

#### Scenario: Repository carries an open-source license

- **WHEN** the repository root is inspected
- **THEN** a `LICENSE` file is present declaring GPL-3.0-or-later

