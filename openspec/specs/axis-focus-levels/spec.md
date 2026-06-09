# axis-focus-levels Specification

## Purpose
TBD - created by archiving change switch-to-three-level-axes. Update Purpose after archive.
## Requirements
### Requirement: Focus-level projection

Each numeric axis score SHALL project to exactly one of three locale-neutral focus levels describing how much focus a company places on that axis: `low`, `medium`, or `high`. A `null` score (no signal) SHALL project to the distinct level `none`, never to `low`. The projection thresholds are: `low` for a score in `[0, 33)`, `medium` for `[33, 66)`, and `high` for `[66, 100]`. These two thresholds (33 and 66) are the same radii the pentagon draws its inner and middle rings at, so a plotted axis dot visibly falls inside the band named by its level.

#### Scenario: Score maps to its band

- **WHEN** an axis has scores `12`, `33`, `65`, and `66`
- **THEN** they project to `low`, `medium`, `medium`, and `high` respectively

#### Scenario: Null score is its own level

- **WHEN** an axis has `score: null`
- **THEN** it projects to `none`, distinct from `low`, and is never treated as a `0` score

#### Scenario: Band thresholds match pentagon rings

- **WHEN** the level thresholds and the pentagon ring radii are compared
- **THEN** the `low`/`medium` boundary and the `medium`/`high` boundary fall at the same fractional radii (0.33 and 0.66) the pentagon renders its inner and middle rings at

### Requirement: Focus-level labels

The three focus levels and the no-signal level SHALL each carry a localized, lowercase label for the active locale (`nl`, `en`). Labels SHALL convey the amount of focus on the axis and MUST NOT frame the level as good or bad quality. The level identifiers (`low`, `medium`, `high`, `none`) are locale-neutral and SHALL NOT be duplicated per locale. The same label for a given level SHALL be used everywhere the level surfaces (filters and detail page) so the vocabulary reads consistently.

#### Scenario: Level renders a localized label

- **WHEN** a `medium` level renders on `/` and on `/en/`
- **THEN** it shows that level's Dutch label on `/` and its English label on `/en/`, both lowercase

#### Scenario: No-signal level reads as unknown

- **WHEN** the `none` level renders
- **THEN** its label reads as the site's existing "no signal" / "geen signaal" wording rather than a focus magnitude

