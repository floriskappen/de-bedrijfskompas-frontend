## Why

Both vendored authorities shipped placement-convention releases: BYOM `v1.1.0` (the `BYOM-INTEGRATION.md` pin doc conventionally lives at `docs/BYOM-INTEGRATION.md`; repo root still acceptable) and ontwerp `v0.1.1` (the consumer pin file moved from `.design/DESIGN.md` to `docs/DESIGN.md`). The app moved both files to `docs/` and bumped both submodules. Four specs reference the old locations (and the BYOM spec references the now-deleted `release/v1` branch and `v1.0.0`); this change syncs the specs to the new placement and pin.

## What Changes

- `byom-consumption`: the integration doc's canonical location becomes `docs/BYOM-INTEGRATION.md` (root still acceptable); the submodule is pinned to a release tag's commit SHA, not a branch — the `release/v1` branch reference is removed; the pin-version scenario advances to `v1.1.0`.
- `design-system-consumption`: the local pin file's canonical location becomes `docs/DESIGN.md` (from `.design/DESIGN.md`) across the requirements that reference it.
- `bring-your-own-key-llm`: the "Constitution conformance" requirement's reference to `BYOM-INTEGRATION.md` at the repository root is updated to `docs/`.
- `map-overview`: the "Deterministic map extensions are recorded" scenario's `.design/DESIGN.md` reference is updated to `docs/DESIGN.md`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `byom-consumption`: pin location (docs/), tag-not-branch pin, version v1.1.0
- `design-system-consumption`: pin-file location docs/DESIGN.md
- `bring-your-own-key-llm`: BYOM-INTEGRATION.md location reference
- `map-overview`: design pin-file location reference

## Impact

Spec-only sync. The implementation (submodule bumps, file moves, `.gitmodules`, `AGENTS.md`, the two pin docs, both consumption tests) already landed in the working tree; this change brings the four specs back in line with reality. No code or behaviour change.
