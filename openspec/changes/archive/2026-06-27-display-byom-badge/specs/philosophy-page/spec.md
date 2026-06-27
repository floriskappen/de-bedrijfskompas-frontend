## MODIFIED Requirements

### Requirement: Content structure

The page SHALL present, in order: a title and first-person intro explaining why the site exists; a set of explanatory sections (how companies are looked at on the five axes, that the axes are subjective and the site is made for the author first, taking time and saving favourites, why where you work matters, public-data-only, and reading silence); the list of the five axes; and a tail section noting the site is static with no accounts, no server, and no tracking or analytics. All prose is lowercase, first-person, and sourced from the active locale.

#### Scenario: Intro and sections render
- **WHEN** the philosophy page renders
- **THEN** it shows the first-person intro followed by the explanatory sections and the static-site tail section

#### Scenario: Static-site note
- **WHEN** the philosophy page renders
- **THEN** it states that the site is static with no accounts, nothing sent to a server, and no tracking or analytics
