## Context

The filter chip UI already has icon slots and tactile chip styling from the ontwerp button recipe. The current implementation chooses one of six paths with `index % 6`, which was acceptable for the old temporary tag set but now collides across the fifteen projected work fields.

## Goals / Non-Goals

**Goals:**

- Give every `DomainGroupId` a distinct icon.
- Keep the icon layer dependency-free because no icon library is installed in this app.
- Keep the icons small, stroked, and `currentColor` driven so selected/pressed states continue to work.

**Non-Goals:**

- Do not redesign filter chips.
- Do not add a third-party icon package.
- Do not change work-field labels, counts, or filtering behavior.

## Decisions

1. Move icon path data to a pure helper module.
   This keeps `MapView` focused on rendering and lets a unit test validate icon coverage without importing Mapbox or React.

2. Use one path string per work field.
   The current chip icons are already small inline SVGs; a path map keeps the implementation compact and ensures the icons inherit the same stroke style.

## Risks / Trade-offs

- Hand-authored symbols are less standardized than a package icon set -> keep them simple, semantic, and covered by a uniqueness test.
