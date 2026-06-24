## 1. Constitution authority and read path

- [x] 1.1 Read `vendor/byom/AGENTS.md`, then `vendor/byom/constitution/02-security-invariants.md`, then `05-integration-guide.md` before editing.
- [x] 1.2 Add an `AGENTS.md` entry alongside the ontwerp entry naming `vendor/byom/AGENTS.md` + `constitution/` (especially `02`) as the BYOK authority, with a BYOK/model-powered-feature trigger. The entry SHALL require `BYOM-INTEGRATION.md` updates for closed gaps or new deviations, and SHALL direct agents to log constitution-level friction in `BYOM_STRUGGLES.md`.

## 2. BYOM-INTEGRATION.md compliance record

- [x] 2.1 Author `BYOM-INTEGRATION.md` at the repository root following `vendor/byom/constitution/05-integration-guide.md`'s ten sections, filled for the current state.
- [x] 2.2 Record the pinned constitution version `v0.1.0` and pinned commit `e2fc406678cfc48ec967af511e6761407a4120cc` in the doc.
- [x] 2.3 Fill the model-powered-features-and-categories section for the Ikigai flow (ISCO derivation, pass-1, pass-2), noting the current hardcoded-model deviation to be resolved by change C.
- [x] 2.4 Fill the per-invariant conformance mapping, pointing each invariant at its current implementation or noting it unmet — invariants 1, 2, 5 met; 3, 4, 6 partial or unmet; honest about each.
- [x] 2.5 Write the Deviations section as a burn-down list: every open gap from `BYOM_INTEGRATION_PLAN.md` §3 with its reason (CSP missing; no stale-key clearing on 401; hardcoded model with no category choice; no pre-flight token estimation; onboarding incomplete; cost transparency partial).
- [x] 2.6 Add a propagation-log section (an app-specific extension, recorded as such) with the initial `none -> v0.1.0` adoption entry.

## 3. byom-consumption structural test

- [x] 3.1 Create `src/lib/byom/byom-consumption.test.ts` mirroring `src/styles/design-system.test.ts`.
- [x] 3.2 Add test `byom constitution bundle is pinned` covering "Constitution is vendored as a release bundle" and "Pin uses an exact release": assert `.gitmodules` has the `vendor/byom` entry with `url = git@github.com:floriskappen/bring-your-own-model.git` and `branch = release/v0.1`; assert `vendor/byom/AGENTS.md`, `VERSION`, `CHANGELOG.md`, and `constitution/` exist; assert `VERSION` is `v0.1.0`; assert `git -C vendor/byom rev-parse HEAD` is `e2fc406678cfc48ec967af511e6761407a4120cc`; assert `git -C vendor/byom describe --tags --exact-match` is `v0.1.0`.
- [x] 3.3 Add test `byom integration document records current adoption` covering "Integration document records the current pin" and the `bring-your-own-key-llm` "Conformance is recorded against a pinned constitution" scenario: assert `BYOM-INTEGRATION.md` names BYOM as the constitution, records version `v0.1.0` and commit `e2fc406`, and contains a Deviations section.
- [x] 3.4 Add test `byom integration document has a propagation log` covering "Propagation log records advances" and "Release update is propagated deliberately": assert the propagation-log section exists with the initial `none -> v0.1.0` entry.
- [x] 3.5 Add test `byok work has local constitution read path` covering "BYOK work has a local read path": assert `AGENTS.md` references `vendor/byom/`, `vendor/byom/AGENTS.md`, `constitution/`, `BYOM-INTEGRATION.md`, and `BYOM_STRUGGLES.md`.

## 4. Friction logging and verification

- [x] 4.1 Log constitution-level friction hit while authoring `BYOM-INTEGRATION.md` to `BYOM_STRUGGLES.md` using its entry template — at minimum: `05` ships no `BYOM-INTEGRATION.template.md`; `05` prescribes no propagation-log section; the BYOK vs BYOM / "key" vs "model" terminology clash. This is the Phase 5 feedback output.
- [x] 4.2 Run the new `byom-consumption` tests, the existing `src/styles/design-system.test.ts`, typecheck, and `openspec status --change adopt-byom-constitution`; confirm the new tests pass on first run (no runtime behaviour change).
