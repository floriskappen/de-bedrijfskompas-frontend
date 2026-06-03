# Agent Guidance

## Design Authority

- The pinned design authority for UI work is `vendor/ontwerp/`; see `.design/DESIGN.md` for the current version, commit, adopted parts, and deviations.
- Before any UI change, read `vendor/ontwerp/AGENTS.md` first, then the relevant files in `vendor/ontwerp/language/`, `vendor/ontwerp/recipes/`, `vendor/ontwerp/zoo/`, and `vendor/ontwerp/values/`.
- Consume semantic and component values from `vendor/ontwerp/values/`; do not introduce new raw colour, spacing, radius, type, or motion values unless they are app-specific extensions recorded in `.design/DESIGN.md`.
- Record adopted parts, adaptations, omissions, extensions, and pin advances in `.design/DESIGN.md`.
- Preserve this app's lowercase user-facing copy convention. Mono utility marks may be uppercase with tracking.
