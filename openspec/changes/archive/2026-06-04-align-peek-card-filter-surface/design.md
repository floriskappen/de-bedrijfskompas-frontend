## Context

The app already defines `--filter-surface` for the filter sheet and its sticky header. The peek card uses the `.ontwerp-card.is-warm` class, which currently points at the page surface instead. Both overlays use the same stepped bottom-sheet motion and should share the same surface colour.

## Goals / Non-Goals

**Goals:**

- Reuse the existing `--filter-surface` value for the peek card background.
- Preserve the paper grain layer and existing shadow/radius treatment.
- Record the adaptation in the design pin file.

**Non-Goals:**

- Do not introduce a new colour token.
- Do not change filter-sheet, map marker, or peek-card layout behavior.

## Decisions

1. Repoint `.ontwerp-card.is-warm` to `--filter-surface`.
   This keeps the fix in the existing card class used by the peek card and avoids adding a one-off class in React.

2. Leave `--filter-card-surface` unchanged.
   That variable is for inset filter cards, not overlay shells; using it on the peek card would make the whole card too translucent.

## Risks / Trade-offs

- The class name `is-warm` no longer describes only the page surface -> the design pin and CSS comment document that it now means the shared warm overlay surface.
