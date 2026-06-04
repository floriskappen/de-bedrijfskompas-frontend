# Agent Guidance

## Design Authority

- The pinned design authority for UI work is `vendor/ontwerp/`; see `.design/DESIGN.md` for the current version, commit, adopted parts, and deviations.
- Before any UI change, read `vendor/ontwerp/AGENTS.md` first, then the relevant files in `vendor/ontwerp/language/`, `vendor/ontwerp/recipes/`, `vendor/ontwerp/zoo/`, and `vendor/ontwerp/values/`.
- Consume semantic and component values from `vendor/ontwerp/values/`; do not introduce new raw colour, spacing, radius, type, or motion values unless they are app-specific extensions recorded in `.design/DESIGN.md`.
- Record adopted parts, adaptations, omissions, extensions, and pin advances in `.design/DESIGN.md`.
- Preserve this app's lowercase user-facing copy convention. Mono utility marks may be uppercase with tracking.

## Commit Messages

- Use a conventional subject line such as `feat(map): ...`, `fix(build): ...`, or `chore(openspec): ...`.
- Prefer a detailed multiline body for non-trivial work. Describe the user-visible change, the data/model or implementation change, and the verification/spec work in separate short paragraphs.
- When OpenSpec changes are part of the commit, mention the archived change names and whether main specs were synced.
- Keep the tone factual and specific; avoid vague summaries like "update files" or "fix stuff".
