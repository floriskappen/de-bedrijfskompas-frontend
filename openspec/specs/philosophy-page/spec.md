# philosophy-page Specification

## Purpose

The philosophy / about page: a static, bilingual reading page telling the project's story in plain first-person prose — why the site starts from the company rather than the vacancy, that the five axes are subjective, why where you work matters, and that the site is static with no tracking — ending with the five-axes list, a standing disclaimer, and a directional reveal.
## Requirements
### Requirement: Routes

The philosophy / about page SHALL be served statically at `/over/` for Dutch and `/en/about/` for English. The locale is determined by the route prefix.

#### Scenario: Dutch about page at /over

- **WHEN** a visitor opens `/over/`
- **THEN** the page renders the philosophy content in Dutch

#### Scenario: English about page at /en/about

- **WHEN** a visitor opens `/en/about/`
- **THEN** the page renders the philosophy content in English

### Requirement: Content structure

The page SHALL present, in order: a title and first-person intro explaining why the site exists; a set of explanatory sections (how companies are looked at on the five axes, that the axes are subjective and the site is made for the author first, taking time and saving favourites, why where you work matters, public-data-only, and reading silence); the list of the five axes; and a tail section noting the site is static with no accounts, no server, and no tracking or analytics. All prose is lowercase, first-person, and sourced from the active locale.

#### Scenario: Intro and sections render
- **WHEN** the philosophy page renders
- **THEN** it shows the first-person intro followed by the explanatory sections and the static-site tail section

#### Scenario: Static-site note
- **WHEN** the philosophy page renders
- **THEN** it states that the site is static with no accounts, nothing sent to a server, and no tracking or analytics

### Requirement: Five-axes list

The page SHALL list all five axes, each with its localized label and one-line plain lead, grouped as a single visual set, and each linking to that axis's info page in the current locale.

#### Scenario: Axis links

- **WHEN** the visitor activates an axis in the list
- **THEN** they are taken to that axis's info page in the current locale

### Requirement: Standing disclaimer

The page SHALL end with a short disclaimer stating this is the author's own opinionated view rather than an objective truth, offering a way to get in touch. The contact SHALL be a `mailto:` link behind link text, with the raw address not shown as visible text.

#### Scenario: Disclaimer with hidden contact

- **WHEN** the philosophy page renders
- **THEN** it shows the opinionated-view disclaimer with a contact link whose visible text is words, not the raw email address

### Requirement: Reveal transition

On load the page SHALL play a directional paper-bloom reveal sweeping from top to bottom, in the site's bloom-curtain idiom. Under a reduced-motion preference the reveal SHALL be suppressed and the page shown directly.

#### Scenario: Reduced motion

- **WHEN** the visitor prefers reduced motion
- **THEN** the page renders without the bloom reveal and remains fully usable

