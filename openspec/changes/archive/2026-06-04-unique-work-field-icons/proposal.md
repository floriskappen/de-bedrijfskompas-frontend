## Why

The work-field filter chips now represent the projected ISCO domain vocabulary, but their icons still cycle through six generic variants. With fifteen work fields, repeated icons make the chip vocabulary harder to scan.

## What Changes

- Replace modulo-based icon selection with a stable one-icon-per-`DomainGroupId` mapping.
- Keep icons inline, monochrome, and currentColor-based so they inherit the existing filter chip states.
- Add a unit test that every configured work field has an icon and no two work fields share the same path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-overview`: work-field filter chips render distinct icons for each work-field identifier.

## Impact

- Affects `src/components/MapView.tsx` and a new pure icon mapping helper/test.
- No dependency, data contract, or design-token changes.
