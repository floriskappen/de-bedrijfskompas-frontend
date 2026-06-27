## 1. Spec sync

- [ ] 1.1 Archive the change with `openspec archive --yes move-vendor-pin-docs-to-docs` so the four delta specs (byom-consumption, design-system-consumption, bring-your-own-key-llm, map-overview) sync into the main specs.
- [ ] 1.2 Verify the main specs reference `docs/BYOM-INTEGRATION.md` / `docs/DESIGN.md` and the BYOM v1.1.0 tag pin (no `release/v1` branch, no `v1.0.0` scenario) after archive.

## 2. Verification

- [ ] 2.1 Run `npx vitest run` and confirm 131/131 green (the consumption tests already assert the new paths/versions/commits).
- [ ] 2.2 Confirm no remaining `.design/DESIGN.md` or root `BYOM-INTEGRATION.md` references in non-vendor, non-archived code/specs.
