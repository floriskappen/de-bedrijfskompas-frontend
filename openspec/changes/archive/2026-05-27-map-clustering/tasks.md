## 1. Setup & Dependencies

- [x] 1.1 Install `supercluster` dependency.

## 2. Core Implementation

- [x] 2.1 Convert the company list to GeoJSON format and initialize a `supercluster` instance.
- [x] 2.2 Listen to Mapbox `zoom` and `move` events to update React states for current zoom and bounds.
- [x] 2.3 Query `supercluster` for visible clusters and points based on current viewport coordinates and zoom level.
- [x] 2.4 Render custom HTML cluster elements that display the total number of companies inside them.
- [x] 2.5 Bind a click listener on cluster markers to animate the map zoom level to the cluster's expansion zoom.
- [x] 2.6 Synchronize the E2E fallback rendering logic in `MapView.tsx` to support mock clustering using the same `supercluster` engine.

## 3. Verification & Testing

- [x] 3.1 Update E2E test "each renderable company has exactly one pin" to ensure it passes by zooming in or asserting correctly on clustered/unclustered elements.
- [x] 3.2 Add E2E test "dynamic clustering based on zoom" to verify clusters appear at lower zoom levels.
- [x] 3.3 Add E2E test "clicking a cluster zooms in" to verify map transitions.
- [x] 3.4 Verify all unit and Playwright E2E tests pass cleanly.
