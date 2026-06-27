## MODIFIED Requirements

### Requirement: Local design pin file
The app MUST maintain `docs/DESIGN.md` from the ontwerp consumer template (the `.design/DESIGN.md` hidden-dir placement is superseded). The pin file SHALL record the pinned version, pinned submodule commit, submodule path, last sync date, adopted recipes/principles, adaptations, omissions, extensions, and propagation history.

#### Scenario: Pin file records current adoption
- **WHEN** `docs/DESIGN.md` is opened
- **THEN** it identifies ontwerp as the system, `vendor/ontwerp` as the submodule path, the current pinned version and commit, and the app-specific adopted/adapted/omitted/extended design choices

#### Scenario: Propagation log exists
- **WHEN** the app adopts or advances a design-system release
- **THEN** `docs/DESIGN.md` contains a propagation-log entry describing what was re-checked or propagated

### Requirement: Agent design authority
The repository MUST provide local agent guidance that directs UI work to read `vendor/ontwerp/AGENTS.md` first, then the relevant `language/`, `recipes/`, `zoo/`, and `values/` files. The guidance SHALL require semantic/component values and `docs/DESIGN.md` updates for adopted parts or deviations.

#### Scenario: UI work has a local read path
- **WHEN** an agent starts UI work in this repository
- **THEN** the repository guidance names `vendor/ontwerp/` as the pinned design authority and tells the agent to use the vendored read order before editing UI

### Requirement: Value layer consumption
The app MUST consume ontwerp design values from the vendored bundle for app-owned UI colors, typography, spacing, radii, borders, and motion values. Existing local utility aliases MAY remain for compatibility, but they SHALL map to ontwerp semantic or component values rather than independent raw values.

#### Scenario: CSS tokens are imported
- **WHEN** global styles are loaded
- **THEN** `vendor/ontwerp/values/css/tokens.css` is imported before app-specific style rules

#### Scenario: Local aliases map to ontwerp values
- **WHEN** app-owned CSS variables or Tailwind theme aliases define paper, ink, accent, border, font, spacing, radius, or motion values
- **THEN** they reference ontwerp semantic/component tokens or are recorded as app-specific extensions in `docs/DESIGN.md`

#### Scenario: Fonts are served from the design bundle
- **WHEN** the page loads app typography
- **THEN** Archivo and JetBrains Mono are sourced from the pinned design bundle or an equivalent local asset path derived from it, not from Google Fonts

### Requirement: Design-system update process
The app MUST advance ontwerp only through a deliberate pin update. A pin update SHALL read the changelog entries between the old and new versions, re-check each named recipe/language ID used by the app, update `docs/DESIGN.md`, and commit the submodule bump with any propagated app changes.

#### Scenario: Release update is propagated deliberately
- **WHEN** the app advances from one ontwerp release to another
- **THEN** the changelog slice between versions is reviewed, affected adopted recipes/language IDs are re-checked, and the pin file records the propagation
