## Why

Dynamic company clustering is needed on the map to ensure visual clarity and performance as the number of registered companies grows. Currently, all pins are shown as individual dots which can clutter the map at low/medium zoom levels.

## What Changes

- Group nearby company pins into dynamic clusters based on the map's current zoom level.
- Render dynamic HTML cluster markers showing the total number of companies in each cluster.
- Transition the map viewport (zoom and center) upon clicking a cluster to reveal sub-clusters or individual company pins.
- Maintain compatibility with the headless fallback mode for testing.

## Capabilities

### New Capabilities

### Modified Capabilities

- `map-overview`: Introduce requirement for dynamic zoom-level and proximity-based clustering of company pins, custom cluster indicators showing the company count, and click-to-zoom interaction.

## Impact

- **Affected Components**: `MapView.tsx` will contain the Mapbox source configuration and DOM marker synchronization logic.
- **Affected Tests**: Playwright E2E tests (`tests/map-overview.spec.ts`) need updates because the initial pin count will change due to clustering.
- **No Data Contract Impact**: The company data schema ingested from the pipeline remains unchanged.
