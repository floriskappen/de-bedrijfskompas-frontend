## MODIFIED Requirements

### Requirement: Pin rendering

Every renderable company MUST appear as either its own pin or be part of a cluster at its coordinates. At lower zoom levels, pins that are close to each other MUST be grouped into dynamic clusters. A cluster marker SHALL render in a distinct style, displaying the count of companies inside it. Clicking on a cluster marker MUST zoom the map to a level where the cluster expands into sub-clusters or individual pins. Pins that are not clustered SHALL render in the uniform style — an ink dot with a thin paper-warm outline and a quiet ink halo. Companies whose axis scores are all `null` MUST still render a pin and remain tappable. The currently-selected pin SHALL carry an additional red halo ring. When two or more companies share the same `latlng` and are not clustered, their pins MUST fan out on a small, deterministic pixel-space rosette around the shared point so each pin stays individually visible and tappable regardless of how many are collocated.

#### Scenario: Every renderable company has one uniform pin

- **WHEN** the map finishes rendering and zoom level is maximum
- **THEN** every renderable company has exactly one pin and all pins share the same colour, size, and halo

#### Scenario: Null-score company is still tappable

- **WHEN** a company has every axis `score: null` and is not clustered
- **THEN** its pin still renders in the uniform style and opens the peek card on tap

#### Scenario: Collocated companies fan out

- **WHEN** two or more companies share the same `latlng` and are not clustered
- **THEN** each pin is offset on a small rosette around the shared point so the pins do not overlap and every one can be tapped individually

#### Scenario: Selected pin gets a red halo ring

- **WHEN** a pin is the currently-selected pin and is not clustered
- **THEN** it is rendered with an additional red halo ring distinguishing it from unselected pins

#### Scenario: Dynamic clustering based on zoom

- **WHEN** the map zoom is low enough that two or more pins are close to each other
- **THEN** they are replaced by a cluster marker showing the count of companies in that cluster

#### Scenario: Clicking a cluster zooms in

- **WHEN** a user clicks on a cluster marker
- **THEN** the map zooms and centers on that cluster, expanding it to reveal its contents
