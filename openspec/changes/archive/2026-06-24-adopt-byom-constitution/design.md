## Context

The app already has a working browser-local BYOK layer (`src/lib/byok/`) consumed by the Ikigai flow, and the BYOM constitution is pinned at `vendor/byom` (v0.1.0, commit `e2fc406`). What is missing is the *authority* wiring: the constitution is not named in `AGENTS.md`, no `BYOM-INTEGRATION.md` compliance record exists, and the BYOK spec has no link to the constitution it must conform to. This change establishes the structural half of BYOM Phase 5 — it follows the precedent the ontwerp `design-system-consumption` capability already sets for "consume a pinned external authority as a submodule."

## Goals / Non-Goals

**Goals:**
- Make the BYOM constitution the named authority for the BYOK layer.
- Author `BYOM-INTEGRATION.md` by following `05-integration-guide.md` literally (the Phase 5 proof run), recording honest current deviations.
- Add a structural `byom-consumption` test that passes immediately and asserts pin + authority + doc presence.
- Wire `BYOM_STRUGGLES.md` as the friction log for B–F.

**Non-Goals:**
- Closing any behavioural gap (CSP, stale-key clearing, pre-flight estimation, model categories, cost transparency, onboarding) — those are changes B–F.
- Displaying the BYOM badge — only when fully compliant (change G).
- Any runtime behaviour change.

## Decisions

### 1. The consumption test is structural-only
`byom-consumption` asserts the pin (submodule entry + `VERSION` + exact commit + `git describe` tag), `AGENTS.md` references, and `BYOM-INTEGRATION.md` presence — nothing behavioural. This mirrors `design-system-consumption` / `src/styles/design-system.test.ts`, which is entirely structural and does not test visual correctness. The behavioural invariants are not yet met; they land as scenarios on `bring-your-own-key-llm` in B–F. Asserting an invariant here would fail on first run — the signal that A has overreached into B–F.

### 2. Test location: `src/lib/byom/byom-consumption.test.ts`
Placed next to the layer it governs, not mirroring ontwerp's `src/styles/design-system.test.ts` home (a slightly odd place for a repo-structure test). Coherence over symmetry: the test is about the byok layer's authority, so it lives with that layer.

### 3. `BYOM-INTEGRATION.md` is the BYOM analog of `.design/DESIGN.md`
Ontwerp's pin file records version/commit/adopted/adapted/omitted/extended plus a propagation log, from a shipped template. BYOM's `05` prescribes a 10-section structure but ships no template file and prescribes no propagation-log section. We author `BYOM-INTEGRATION.md` per `05` and add a propagation-log section as an *app-specific extension* (recorded as such in the doc), so constitution advances get a deliberate-update record. The missing template and missing propagation-log prescription in `05` are friction to log in `BYOM_STRUGGLES.md`.

### 4. Authority made visible in the byok spec via a real requirement
Rather than editing the byok spec's orphaned `Purpose: TBD` line (OpenSpec deltas are requirement-scoped, so a Purpose edit is not a clean delta), we add a "Constitution conformance" requirement pointing the byok capability at the pinned constitution and `BYOM-INTEGRATION.md`. It is structural and immediately passing, and makes the authority visible *in the implementation spec*, not only in `AGENTS.md`.

### 5. Deviations is a burn-down list
At A, `BYOM-INTEGRATION.md`'s deviations section is long (every gap from `BYOM_INTEGRATION_PLAN.md` §3) and *shrinks* as B–F close gaps — the opposite of a doc that grows over time. Later agents should treat a long deviations section as expected work-to-do, not a problem to hide.

## Risks / Trade-offs

- [Exact commit SHA in the test rots on every pin advance] → intentional, mirrors ontwerp; a pin advance deliberately updates the SHA and the propagation log.
- [`BYOM-INTEGRATION.md` and `BYOM_INTEGRATION_PLAN.md` §3 can drift] → after A, `BYOM-INTEGRATION.md` is the source of truth; the plan's §3 is the starting snapshot and goes stale by design.
- [The byok "Constitution conformance" requirement is a thin pointer] → accepted; it is the cleanest OpenSpec-native way to make the authority visible in the byok spec without leaking B–F's invariant work into A.
