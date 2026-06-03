## ADDED Requirements

### Requirement: Ontwerp-aligned map UI
The map overview MUST render app-owned map chrome, score badges, clusters, filter controls, bottom sheets, peek cards, empty states, and score graphics using the pinned ontwerp design system's semantic values and relevant recipes. Existing map behavior, route behavior, URL selection state, filter semantics, geolocation behavior, localization, and null-score semantics MUST remain unchanged.

#### Scenario: Map UI uses pinned values
- **WHEN** `/` or `/en/` renders the map overview
- **THEN** app-owned map UI surfaces, text, borders, controls, markers, badges, and state overlays use values derived from `vendor/ontwerp/values/`

#### Scenario: Map behavior is preserved
- **WHEN** the map overview is reskinned with ontwerp values and recipes
- **THEN** existing pin selection, cluster expansion, geolocation, filtering, URL state, peek-card content, and locale behavior continue to match the map-overview requirements

#### Scenario: Interactions follow stepped or immediate motion
- **WHEN** a user opens the peek card, opens the filter sheet, presses app-owned buttons, changes filters, selects pins, or uses app-owned map controls
- **THEN** app-owned motion is either immediate, stepped, or disabled under reduced-motion preferences rather than using generic smooth/default transitions

#### Scenario: Status and unknown states avoid generic defaults
- **WHEN** the map renders empty states, active filter counts, selected pins, unknown score badges, null axes, or unavailable tag sections
- **THEN** those states use ontwerp-compatible paper, ink, accent, mono utility marks, and distinct unknown/no-signal treatments rather than default blue, green check, spinner, or rounded system styles

#### Scenario: Deterministic map extensions are recorded
- **WHEN** app-specific map UI extends beyond the shipped ontwerp recipes
- **THEN** `.design/DESIGN.md` records the extension and names the relevant recipes or principles it follows

#### Scenario: Themed surfaces stay subtle and legible
- **WHEN** the basemap, ambient bloom, peek card, and filter surfaces apply the active skin
- **THEN** they carry only a faint wash of the theme while saturated accent colour is reserved for intentional accents (CTA, active tags, cluster pigment, indicator dots), and dark themed marks such as the cluster pigment keep their numerals legible
