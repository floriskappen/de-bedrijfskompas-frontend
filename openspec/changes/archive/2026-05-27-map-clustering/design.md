## Context

We need to add dynamic clustering of companies on the map based on the map's current zoom level. The implementation must function both in the standard Mapbox GL JS map and in the WebGL-less fallback mode used for E2E testing.

## Goals / Non-Goals

**Goals:**
- Dynamically group company pins into clusters based on zoom level and proximity.
- Style clusters to display the total number of companies inside them.
- Support click-to-zoom on clusters to zoom/pan to the next level (revealing sub-clusters or pins).
- Keep E2E tests green and support clustering logic in fallback mode.

**Non-Goals:**
- Persistent map filtering (which is a separate planned capability).
- Modifying the underlying company coordinates or data schema.

## Decisions

### 1. Clustering Engine: JS-based `supercluster`
- **Chosen**: Use the JavaScript `supercluster` library to calculate clusters, keeping a cache of markers.
- **Alternatives**: Mapbox GL JS native source clustering (`cluster: true` with `querySourceFeatures`).
- **Rationale**: Mapbox source clustering is tied to WebGL and tile loading, making it incompatible with the E2E headless fallback map. By using `supercluster` directly in React state, we can use the exact same clustering logic for both standard Mapbox and the test fallback mode.

### 2. State Synchronization
- **Chosen**: Store current `zoom` and `bounds` in React state, updated via Mapbox `zoomend` and `moveend` listeners.
- **Rationale**: Keeps the React component in sync with the map viewport, allowing pure React rendering of marker elements or deterministic DOM updates.

### 3. Click-to-Zoom Behavior
- **Chosen**: Clicking a cluster fetches the expansion zoom using `supercluster.getClusterExpansionZoom(clusterId)` and centers/zooms the map using `map.flyTo` / `map.easeTo`.
- **Rationale**: Provides a smooth zooming transition that reveals the underlying elements in the cluster.

### 4. Co-located Pin Rosettes
- **Chosen**: Keep the Vogel sunflower rosette offset logic for pins that share the exact same coordinates and are no longer clustered at the max zoom level.
- **Rationale**: Prevents overlap when clustering is no longer active at deep zoom levels.

## Risks / Trade-offs

- **[Risk]** Package bloat or installation issues.
  - **Mitigation** → `supercluster` is extremely lightweight (< 5KB gzipped) and has zero dependencies.
- **[Risk]** Fallback Map viewport boundaries in tests.
  - **Mitigation** → Define a static bounding box and zoom level for the fallback mode to feed into `supercluster`, ensuring predictable output for E2E tests.
