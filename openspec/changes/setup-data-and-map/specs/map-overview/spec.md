## ADDED Requirements

### Requirement: Routes

The map experience MUST be reachable at two routes: `/` (Dutch, default, unprefixed) and `/en/` (English mirror). Both routes render the same map and pin set; only the page chrome (UI strings) and the prose sourced from company records SHALL differ between them.

#### Scenario: Dutch route at root

- **WHEN** a user navigates to `/`
- **THEN** the page renders the map with Dutch UI strings and Dutch company prose

#### Scenario: English route under /en/

- **WHEN** a user navigates to `/en/`
- **THEN** the page renders the map with English UI strings and English company prose

### Requirement: Map view initialization

On page load, an interactive Mapbox map MUST render covering the page background. The initial viewport SHALL be auto-fitted to enclose every renderable company's coordinates with a small padding, unless a `?selected` query parameter is present and resolves to a known company — in which case the initial viewport SHALL center on that company.

#### Scenario: Auto-fit on cold load

- **WHEN** the page loads without `?selected`
- **THEN** the map's initial bounds enclose every rendered pin with padding

#### Scenario: Deep-link initial viewport

- **WHEN** the page loads with `?selected=<known-id>`
- **THEN** the initial viewport centers on that company's coordinates

### Requirement: Pin rendering and tiers

Every renderable company MUST appear as exactly one pin at its `coords`. Each pin's visual tier SHALL be derived from the company's **aggregate score**: the integer mean of its non-null axis scores, rounded to the nearest integer. A company whose every axis score is null has no aggregate score.

**Tiers** (load-bearing thresholds):
- aggregate `>= 80`: large, accent (red), prominent halo
- aggregate `>= 70 and < 80`: medium, ink, mid halo
- aggregate `>= 0 and < 70`: small, ink, small halo
- no aggregate (every axis null): smallest, faint, no halo

#### Scenario: Each renderable company has exactly one pin

- **WHEN** the map finishes rendering
- **THEN** the number of pins equals the size of the renderable collection

#### Scenario: Aggregate score determines tier

- **WHEN** a company's non-null axis scores have a mean of 82
- **THEN** its pin renders at the `>= 80` tier (large, accent, prominent halo)

#### Scenario: All-null company renders at the faintest tier and stays tappable

- **WHEN** a company has every axis `score: null`
- **THEN** its pin renders at the faint tier and is still tappable to open a peek card

### Requirement: Pin selection and URL state

Tapping a pin MUST select the corresponding company and persist the selection in the URL as `?selected=<company_id>`. Tapping the selected pin again, tapping outside any pin, or pressing Escape SHALL clear the selection. Selection deep-links MUST survive reload.

#### Scenario: Selecting a pin updates the URL and opens the peek card

- **WHEN** a user taps the pin for `fairphone`
- **THEN** the URL becomes `?selected=fairphone` and the Fairphone peek card opens

#### Scenario: Deep-link opens peek card on first paint

- **WHEN** a user opens a page with `?selected=fairphone`
- **THEN** the corresponding pin is rendered as selected and the peek card is open before user interaction

#### Scenario: Unknown selection is ignored

- **WHEN** the URL carries `?selected=<unknown-id>`
- **THEN** no peek card opens and the unrecognized parameter is removed from the URL

#### Scenario: Clearing selection

- **WHEN** a user taps the currently-selected pin, taps outside any pin, or presses Escape
- **THEN** the peek card closes and the `selected` parameter is removed from the URL

### Requirement: Peek card content

When a company is selected, a peek card MUST overlay the bottom of the map. The peek card SHALL contain, in order: the company's `name` as the heading; a single locality line drawn from `address.city`; the **tagline** in the current locale (with fallback to the other locale per `company-data`); a pentagon visualization of all five axis scores in fixed order — `substance`, `ecology`, `power`, `embeddedness`, `posture` — with null-scored axes rendered visually distinct from low-scored axes; a primary CTA labeled "open volledig profiel" (nl) / "open full profile" (en); and a secondary bookmark action that is visually present but inert.

#### Scenario: Peek card renders current-locale prose

- **WHEN** a user on `/` selects `gravity`
- **THEN** the peek card renders `gravity.nl.tagline`; on `/en/`, the same selection renders `gravity.en.tagline`

#### Scenario: Pentagon renders all five axes including nulls

- **WHEN** a selected company has `scores.power.score: null`
- **THEN** the pentagon's power arm renders in the null style while the other four arms render at their numeric values

### Requirement: Detail navigation

The peek card's primary CTA MUST navigate to the detail route for the selected company: `/<company_id>/` from `/`, and `/en/<company_id>/` from `/en/`. Slugs SHALL NOT be translated between locales.

#### Scenario: CTA preserves locale and uses the company slug

- **WHEN** a user on `/en/` selects `gravity` and activates the CTA
- **THEN** they navigate to `/en/gravity/`

### Requirement: Language switcher

The page MUST expose a language switcher that toggles between `/` and `/en/`. Switching SHALL preserve any active `?selected` parameter so the same pin remains selected across the locale change.

#### Scenario: Switcher preserves selection across locales

- **WHEN** a user on `/?selected=gravity` activates the language switcher
- **THEN** they arrive at `/en/?selected=gravity` with Gravity still selected

#### Scenario: Switcher toggles back to default

- **WHEN** a user on `/en/` (with no querystring) activates the switcher
- **THEN** they navigate to `/`

### Requirement: Empty data state

When the renderable company collection is empty at build time, the route MUST build successfully and render the map with no pins plus a quiet overlay message ("geen bedrijven in beeld" on `/`, "no companies in view" on `/en/`).

#### Scenario: Empty collection still renders the map

- **WHEN** there are zero renderable companies at build time
- **THEN** the map renders with no pins and the quiet overlay message is visible

## Operational Pitfalls

- **Mapbox public access token at build time.** The token is read from an environment variable and a missing token MUST fail the build rather than silently falling back to an unstyled map. Token leakage is mitigated by domain restriction in the Mapbox dashboard, not by code.
- **Selection state is client-hydrated, not pre-rendered.** The selected pin and peek card open state live inside a client island and are reconstructed from the URL on mount. Static HTML SHALL NOT serialize a specific selection — otherwise static caches will pin every visitor to whichever selection happened to be in the build snapshot.
- **Locale-only chrome translation.** UI strings (titles, button labels, hint text, the language switcher label, empty-state copy) translate between locales; slugs and company identifiers do not. Mixing a translated slug into a route will produce a 404.
