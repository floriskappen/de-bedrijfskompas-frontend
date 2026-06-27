# Agent Guidance

## Design Authority

- The pinned design authority for UI work is `vendor/ontwerp/`; see `docs/DESIGN.md` for the current version, commit, adopted parts, and deviations.
- Before any UI change, read `vendor/ontwerp/AGENTS.md` first, then the relevant files in `vendor/ontwerp/language/`, `vendor/ontwerp/recipes/`, `vendor/ontwerp/zoo/`, and `vendor/ontwerp/values/`.
- Consume semantic and component values from `vendor/ontwerp/values/`; do not introduce new raw colour, spacing, radius, type, or motion values unless they are app-specific extensions recorded in `docs/DESIGN.md`.
- Record adopted parts, adaptations, omissions, extensions, and pin advances in `docs/DESIGN.md`.
- Preserve this app's lowercase user-facing copy convention. Mono utility marks may be uppercase with tracking.

## BYOM Authority

- The pinned authority for the browser-local BYOK layer (`src/lib/byok/`) and any model-powered feature is `vendor/byom/`; see `docs/BYOM-INTEGRATION.md` for the current pinned version, per-invariant conformance mapping, and deviations.
- Before any BYOK or model-powered-feature change, read `vendor/byom/AGENTS.md` first, then `vendor/byom/constitution/02-security-invariants.md` (mandatory) and the constitution chapters relevant to the work.
- The BYOK layer conforms to the BYOM constitution. Record closed gaps or new deviations in `docs/BYOM-INTEGRATION.md`; do not close a gap without updating its deviation entry.
- `vendor/byom/website/` is movement-facing; ignore it for implementation decisions.

## Commit Messages

- Use a conventional subject line such as `feat(map): ...`, `fix(build): ...`, or `chore(openspec): ...`.
- Prefer a detailed multiline body for non-trivial work. Describe the user-visible change, the data/model or implementation change, and the verification/spec work in separate short paragraphs.
- When OpenSpec changes are part of the commit, mention the archived change names and whether main specs were synced.
- Keep the tone factual and specific; avoid vague summaries like "update files" or "fix stuff".
