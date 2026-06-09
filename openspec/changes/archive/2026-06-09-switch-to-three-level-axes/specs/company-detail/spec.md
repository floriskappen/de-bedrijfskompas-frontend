## MODIFIED Requirements

### Requirement: Axis reasoning list

The page SHALL list the five axes — in the fixed order `substance`, `ecology`, `power`, `embeddedness`, `posture` — using the site's axis labels (`inhoud`, `ecologie`, `macht`, `verankering`, `houding` in Dutch). Each collapsed axis row SHALL show the axis's focus level (`low`, `medium`, or `high`) as a compact three-bar focus meter — one filled bar for `low`, two for `medium`, three for `high` — carrying the localized level label as its accessible name. An axis with a `null` score or `no_signal` evidence SHALL instead show the no-signal meter (all three bars hollow) and read as "geen signaal". The same focus meter SHALL be the shared focus-level indicator used on the favorites cards and as the selected minimum in the filter sheet. Each axis row SHALL be tappable to expand, revealing the axis's evidence level and the localized reasoning prose for why it scored as it did.

#### Scenario: Collapsed row shows the focus level

- **WHEN** an axis has a numeric score
- **THEN** its collapsed row shows that axis's focus level as a focus meter whose filled-bar count matches the band (`low`/`medium`/`high`) and whose accessible name is the localized level label

#### Scenario: No-signal row shows the unknown state

- **WHEN** an axis has a `null` score or `no_signal` evidence
- **THEN** its collapsed row shows the hollow no-signal meter labelled "geen signaal" instead of a focus level, and the row is visibly de-emphasized

#### Scenario: Expand an axis

- **WHEN** the visitor taps an axis row
- **THEN** the row expands to show the axis's evidence level and its localized `reason` text
- **AND** any previously expanded row's behaviour is consistent (at least the tapped row's content becomes visible)

#### Scenario: Evidence level shown inside the expanded row

- **WHEN** an expanded axis row renders its evidence
- **THEN** it displays the axis's `evidence` value (`well_evidenced`, `partial`, or `no_signal`) as a localized, lowercase label with its glyph, within the expanded panel rather than on the collapsed row

#### Scenario: Missing reason text

- **WHEN** an axis's `reason` is empty in both locales
- **THEN** the expanded row shows the evidence only, without an empty prose block
