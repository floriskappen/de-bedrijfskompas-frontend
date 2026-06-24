## Why

The BYOM constitution is pinned at `vendor/byom` (v0.1.0) but is not yet the named authority for the BYOK layer, and no `BYOM-INTEGRATION.md` exists. BYOM ROADMAP Phase 5 requires a consuming app to author that doc by following `vendor/byom/constitution/05-integration-guide.md` literally — this change runs that validation for the structural half and establishes the friction-feedback loop (`BYOM_STRUGGLES.md`) before any gap-closing work (changes B–F in `BYOM_INTEGRATION_PLAN.md`).

## What Changes

- Add a `byom-consumption` shared capability asserting the constitution is pinned, agent guidance points at it, and `BYOM-INTEGRATION.md` exists at the repo root.
- Add an `AGENTS.md` entry naming `vendor/byom/AGENTS.md` + `constitution/` as the BYOK authority, mirroring the ontwerp entry with a BYOK-scoped trigger.
- Author a draft `BYOM-INTEGRATION.md` (all ten sections from `05`) recording the current compliance state and an honest deviations list — the open gaps to be closed by B–F.
- Add a `byom-consumption` structural test mirroring `src/styles/design-system.test.ts` (pin + authority + integration-doc presence), at `src/lib/byom/byom-consumption.test.ts`.
- Wire `BYOM_STRUGGLES.md` (already present) as the friction log agents must update during B–F.

No runtime behaviour change. No badge — adopted ≠ compliant; the badge lands in the finalize change (G).

## Capabilities

### New Capabilities
- `byom-consumption`: structural consumption of the BYOM constitution — pinned submodule, local integration document, agent authority, and deliberate update process.

### Modified Capabilities
- `bring-your-own-key-llm`: add a "Constitution conformance" requirement pointing the BYOK layer at the pinned constitution and `BYOM-INTEGRATION.md` as its compliance record.

## Impact

- Adds `openspec/specs/byom-consumption/` (on archive) and a structural test at `src/lib/byom/byom-consumption.test.ts`.
- Adds the root `BYOM-INTEGRATION.md` compliance record; references the already-present `BYOM_STRUGGLES.md`.
- Modifies `AGENTS.md` (new BYOM entry alongside the ontwerp entry).
- Does not touch BYOK runtime code, the Ikigai flow, or the pipeline data contract. Behavioural gap-closing is deferred to B–F per `BYOM_INTEGRATION_PLAN.md`.
