## Context

Both vendor submodules released placement-convention changes: BYOM v1.1.0 moves the consuming app's `BYOM-INTEGRATION.md` to `docs/` (root still acceptable); ontwerp v0.1.1 moves the consumer pin file from `.design/DESIGN.md` to `docs/DESIGN.md`. The app already moved both files and bumped both submodules in the working tree. Four specs still reference the old locations/branch/version and are now stale. This is a spec-sync change — no code or behaviour.

Separately, BYOM's release-branch layout changed: the per-version `release/v0.1`/`release/v1` branches were deleted (the submodule was already pinned to a tag commit SHA, so the pin is unaffected); `main` is dev and `release` is a squashed one-commit-per-version ledger. The `byom-consumption` spec said "tracking the `release/v1` branch," which is now false.

## Goals / Non-Goals

**Goals:**
- Sync the four specs to the new `docs/` placement and the BYOM v1.1.0 tag pin.
- Record that the BYOM submodule is pinned to a tag, not a branch.

**Non-Goals:**
- Changing any behaviour, code, or test (already done in the working tree).
- Re-litigating the placement choice — both vendors bless `docs/`, and the app adopts it.

## Decisions

### Adopt `docs/` as the canonical location for both pin docs

Both vendors now bless `docs/` (`docs/BYOM-INTEGRATION.md`, `docs/DESIGN.md`); the app moved the files there. The specs are updated to name `docs/` as the location. For BYOM, the root remains an acceptable alternative per `05` v1.1.0, so the spec keeps the "conventionally at `docs/`" framing rather than mandating it exclusively.

### Pin to a tag, not a branch (BYOM)

The `byom-consumption` "Pinned constitution bundle" requirement said "tracking the `release/v1` branch." That branch is deleted. The requirement is reworded to pin to a released version tag's commit SHA (which is what the app already does and what the consumption test asserts via `git describe --tags --exact-match`). The ontwerp submodule continues to track the `release` branch (unchanged upstream), so its requirement is untouched on the branch point.

### Minimal, location-only spec edits

The four spec edits change only the pin-doc path (and, for BYOM, the branch→tag framing and version). No requirement's intent or acceptance bar changes.

## Risks / Trade-offs

- [Spec leads implementation briefly] → Acceptable and normal for OpenSpec: the implementation/tests already reflect `docs/` and v1.1.0; this change syncs the specs to match. The consumption tests pass against reality regardless of spec state.
- [Root still acceptable for BYOM] → The spec keeps root as an alternative so a future consumer or revert isn't non-conformant; the app simply chooses `docs/`.
