## MODIFIED Requirements

### Requirement: Top bar

The page SHALL carry a top bar with an origin-aware back control, plus quiet icon affordances for toggling the current company as a favorite and, when present, opening its website. By default — and when reached from the map peek card — the back control SHALL return to the map for the current locale with this company selected, so the map re-opens the peek card it was reached from. When the detail page is reached from the favorites overview (signalled by a `from=favorites` origin marker on the URL), the back control SHALL instead return to the localized favorites overview page and carry the localized "back to favorites" label. The favorite control SHALL reflect whether the current company is saved in browser-local favorites and SHALL toggle that state without navigating.

#### Scenario: Back to the map keeps the company selected

- **WHEN** the visitor reached the detail page from the map and activates the back control
- **THEN** they return to the map for the current locale with this company selected and its peek card re-opened

#### Scenario: Back to favorites when reached from the overview

- **WHEN** the visitor opened the detail page from the favorites overview (a `from=favorites` origin)
- **THEN** the back control returns to the localized favorites overview page rather than the map

#### Scenario: Favorite control reflects saved state

- **WHEN** the company is saved in browser-local favorites
- **THEN** the detail-page favorite control shows selected state

#### Scenario: Favorite control toggles without navigation

- **WHEN** the visitor activates the detail-page favorite control
- **THEN** the current company favorite state changes
- **AND** the visitor remains on the detail page

#### Scenario: Website affordance present

- **WHEN** the company has a `website`
- **THEN** the top bar shows a control that opens that URL in a new tab

#### Scenario: Website affordance absent

- **WHEN** the company has no `website`
- **THEN** no website control is shown
