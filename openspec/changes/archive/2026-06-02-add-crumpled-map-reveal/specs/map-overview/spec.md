## ADDED Requirements

### Requirement: Initial map reveal

On initial page load, the map experience SHALL reveal the full map surface from behind a brief stepped paper-grain cover animation. The reveal SHALL apply on both `/` and `/en/`, complete automatically into the normal full-screen map view, and respect reduced-motion preferences by rendering directly in the final state when motion is reduced. The reveal MUST NOT transform or resize the map surface, and MUST NOT prevent existing initial state behavior such as auto-fit, empty state rendering, or `?selected` deep-link selection.

#### Scenario: First load reveals from paper

- **WHEN** a user navigates to `/` or `/en/`
- **THEN** the map page starts behind a paper-grain cover, reveals in stepped openings, and settles into the normal full-screen map view

#### Scenario: Reduced motion skips the reveal

- **WHEN** a user whose system preference is reduced motion navigates to `/` or `/en/`
- **THEN** the map page renders directly in the normal full-screen map view without the reveal animation

#### Scenario: Deep-link state survives the reveal

- **WHEN** a user opens `/?selected=<known-id>` or `/en/?selected=<known-id>`
- **THEN** the reveal does not prevent the matching company from being selected and the peek card from opening
