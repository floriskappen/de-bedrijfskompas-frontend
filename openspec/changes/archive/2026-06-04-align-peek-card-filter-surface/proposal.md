## Why

The peek card and filter sheet are paired bottom overlays, but their top surfaces currently use different background colours. Aligning the peek card with the filter panel header makes the map chrome read as one coherent object.

## What Changes

- Set the peek card warm card surface to the same `--filter-surface` used by the filter panel header.
- Update the design pin note to record that shared overlay surface.
- Update the browser expectation that checks the peek card background colour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-overview`: the peek card surface must visually align with the filter panel header surface.

## Impact

- Affects `src/styles/global.css`, `.design/DESIGN.md`, and one Playwright visual assertion.
- No data contract or dependency changes.
