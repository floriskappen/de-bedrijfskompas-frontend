## MODIFIED Requirements

### Requirement: Peek card content

When a company is selected, a peek card MUST overlay the bottom of the map showing, in order, a pentagon of all five axis scores, the company's identity, and its tagline in the current locale as plain inline text. The identity tile SHALL render a square ink monogram tile showing the first letter of the company name, preserving source casing. The card's top-right corner SHALL carry two icon buttons: a favorite toggle and an explicit close button that clears the selection. The whole card SHALL be the primary affordance: a tap or Enter/Space when focused opens the company's detail route, and the whole card SHALL be the drag surface.

#### Scenario: Favorite toggle does not open detail page

- **WHEN** a visitor activates the peek-card favorite toggle
- **THEN** the selected company favorite state changes
- **AND** the peek card remains open
- **AND** the visitor is not navigated to the detail page
