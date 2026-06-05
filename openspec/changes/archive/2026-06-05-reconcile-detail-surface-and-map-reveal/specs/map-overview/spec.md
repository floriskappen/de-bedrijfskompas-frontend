## MODIFIED Requirements

### Requirement: Initial map reveal

When the map is entered directly — a first visit, a reload, or a deep link — the map experience SHALL reveal the full map surface from behind a brief stepped paper-grain cover animation. The reveal SHALL apply on both `/` and `/en/`, complete automatically into the normal full-screen map view, and respect reduced-motion preferences by rendering directly in the final state when motion is reduced. When the map is instead reached by an in-app bloom transition from the detail page (the detail back control returning to the map), the reveal SHALL be skipped and the map SHALL appear at once, because the conceal curtain has already bridged the cut. The skip decision SHALL be made before the cover paints, so neither path shows a flash of the other. The reveal MUST NOT transform or resize the map surface, and MUST NOT prevent existing initial state behavior such as auto-fit, empty state rendering, or `?selected` deep-link selection.

#### Scenario: Direct entry reveals from paper

- **WHEN** a user navigates to `/` or `/en/` directly, reloads it, or opens a deep link
- **THEN** the map page starts behind a paper-grain cover, reveals in stepped openings, and settles into the normal full-screen map view

#### Scenario: Return from detail skips the reveal

- **WHEN** the user activates the detail page back control and the map is reached through the in-app bloom transition
- **THEN** the map appears immediately without the stepped paper-grain cover animation

#### Scenario: Reduced motion skips the reveal

- **WHEN** a user whose system preference is reduced motion navigates to `/` or `/en/`
- **THEN** the map page renders directly in the normal full-screen map view without the reveal animation

#### Scenario: Deep-link state survives the reveal

- **WHEN** a user opens `/?selected=<known-id>` or `/en/?selected=<known-id>`
- **THEN** the reveal does not prevent the matching company from being selected and the peek card from opening
