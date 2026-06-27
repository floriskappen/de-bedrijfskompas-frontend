# byom-badge Specification

## Purpose
TBD - created by archiving change display-byom-badge. Update Purpose after archive.
## Requirements
### Requirement: Canonical badge on the about page

The app SHALL display the canonical BYOM small badge (light variant, 96×26) on the philosophy / about page, embedded as a self-hosted `<img>` element served from the app's own origin (not from a remote badge origin), wrapped in a link to `https://byom.flkp.nl/` with `rel="noopener"`. The `<img>` SHALL carry the canonical alt text: "BYOM badge — Bring Your Own Model: follows the pattern and security invariants, not proof of safety." Only the light variant SHALL be shipped (the app has no dark theme). The honest claim travels with the badge in this alt text.

#### Scenario: Dutch about page carries the badge
- **WHEN** a visitor opens `/over/`
- **THEN** the page renders the canonical small light BYOM badge as an `<img>` served from the app's own origin

#### Scenario: English about page carries the badge
- **WHEN** a visitor opens `/en/about/`
- **THEN** the page renders the canonical small light BYOM badge as an `<img>` served from the app's own origin

#### Scenario: Badge links to the BYOM site
- **WHEN** the badge is activated
- **THEN** it opens `https://byom.flkp.nl/` with `rel="noopener"`

#### Scenario: Badge carries the canonical honest alt text
- **WHEN** the badge `<img>` is inspected
- **THEN** its `alt` text states that the app follows the BYOM pattern and security invariants and is not proof of safety

### Requirement: Badge stays canonical and origin-local

The canonical badge SHALL be embedded via `<img>` (not inlined into the DOM) and SHALL NOT be recoloured to the app palette, so it renders identically across apps and cannot read the host page's `currentColor` or CSS variables. The badge asset SHALL be served from the app's own origin so that no remote badge origin is added to the Content-Security-Policy; the CSP `img-src`/`default-src` posture SHALL remain `'self'`.

#### Scenario: Badge is an unmodified self-hosted image
- **WHEN** the badge embed is inspected
- **THEN** it is an `<img>` loading a self-hosted SVG whose bytes match the canonical badge asset, with no inline-DOM recolouring

#### Scenario: No remote badge origin is added to the CSP
- **WHEN** the built page's Content-Security-Policy is inspected
- **THEN** `https://byom.flkp.nl` does not appear in `img-src` or `default-src`, and the badge `<img>` loads from the app's own origin

### Requirement: Bare themeable mark in the BYOK connection surface

The BYOK connection-management surface SHALL carry the bare BYOM mark inlined into the DOM (not loaded via `<img>`), themed via `currentColor` so it inherits the surrounding text colour, placed as a small subtle affordance at the foot of the surface alongside a "BYOM" wordmark. The mark and wordmark together SHALL link to `https://byom.flkp.nl/` with `rel="noopener"`. It is a lightweight "BYOM-powered" affordance, not the canonical badge: it SHALL NOT carry the trust-claim alt text and SHALL NOT be recoloured away from the host text colour. It SHALL NOT interfere with the surface's key, budget, leave-guard, or spend behaviour.

#### Scenario: Foot link appears themed to the host
- **WHEN** the BYOK connection-management surface is shown
- **THEN** a small inlined bare BYOM mark plus a "BYOM" wordmark is rendered at the foot of the surface, inheriting the surrounding text colour via `currentColor`

#### Scenario: Foot mark links to the BYOM site
- **WHEN** the foot BYOM mark and wordmark is activated
- **THEN** it opens `https://byom.flkp.nl/` with `rel="noopener"`

