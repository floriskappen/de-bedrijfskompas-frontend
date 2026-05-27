## 1. Design tokens & atmosphere

- [x] 1.1 Replace `src/styles/global.css` token block with de-ontwerp palette (paper, ink scale, red, ease-paper) and load Archivo + JetBrains Mono from Google Fonts
- [x] 1.2 Set `body` to lowercase + Archivo defaults; `[style*="JetBrains Mono"]`, `.mark`, `code` opt back into uppercase + 0.08em
- [x] 1.3 Drop `public/paper-grain-soft.svg` from the design bundle into `public/` so the peek card can reference it
- [x] 1.4 Drop the old `Outfit`/`paper-card`/`brand-red` Tailwind tokens; map remaining usages to the new tokens

## 2. Map chrome (Map page)

- [x] 2.1 Render a top-right filters pill (icon + word, inert button) sharing the chrome idiom (paper bg, 1px ink border, mono-uppercase label) with the language switcher
- [x] 2.2 Render a centered bottom hint ("N bedrijven in beeld · tik een pin" / "N companies in view · tap a pin") that hides when a pin is selected — hide via a tiny client island reading `?selected` + listening to `selection-changed`
- [x] 2.3 Add i18n keys: `filters`, `hint_template`, `in_het_echt`

## 3. Pin styling

- [x] 3.1 In `MapView.tsx`, render every marker with a single uniform ink-dot style (no score lookup); drop the `data-pin-tier` attribute
- [x] 3.2 Selected pin gets an additional red halo ring (and pulls to z-50) — keep current click-toggle and Escape behaviour
- [x] 3.3 Apply the same uniform style in the WebGL-fallback branch
- [x] 3.4 Remove `computeAggregate` and `pinTier` from `src/lib/company-data/index.ts` — they have no remaining callers
- [x] 3.5 Restyle the geolocate button to be a subtle floating affordance: smaller (40px), paper/85 background, 1px ink/25 border, ink-soft icon that strengthens on hover — no heavy drop shadow

## 4. Peek card

- [x] 4.1 Remove the explicit X close button; add a drag handle div at the top of the card
- [x] 4.2 Render the header as: square monogram (first char of `company.name`, source casing preserved) · `name` (source casing preserved via `normal-case`) · locality-with-distance line
- [x] 4.3 Wrap the tagline in the "in het echt" / "in real life" callout block (red-soft background, mono label up top)
- [x] 4.4 Sharp corners (no `rounded-*`) across card, CTA, and bookmark; CTA gets an arrow glyph
- [x] 4.5 Apply paper-grain texture to the card background

## 5. Pentagon

- [x] 5.1 Match HiFiPentagon styling: 3 concentric ring polygons (innermost + middle dashed + outer solid), spokes dashed for null axes, "?" centered glyph for null/no-evidence axes, red accent polygon, JetBrains Mono uppercase axis labels positioned at radius * 1.24
- [x] 5.2 Drop the surrounding card chrome from `Pentagon.tsx` (the peek card already provides container)

## 6. Language switcher

- [x] 6.1 Restyle to sharp corners, paper-warm background, 1px ink border, Archivo type — match the chrome pills

## 7. Verification

Each Playwright test name below maps explicitly to one or more spec scenarios so coverage is auditable.

- [ ] 7.1 `npm run build` succeeds
- [ ] 7.2 Existing `tests/map-overview.spec.ts` still passes (selection, deep-link, language switch, geolocation, empty state) — adjust selectors only if tests target the removed X button or the old uniform pin class
- [ ] 7.3 Add `tests/pins.spec.ts` covering the Pin rendering scenarios:
  - `every renderable company has one uniform pin` → Scenario: Every renderable company has one uniform pin
  - `null-score company is still tappable` → Scenario: Null-score company is still tappable
  - `selected pin carries red halo ring` → Scenario: Selected pin gets a red halo ring
- [ ] 7.4 Add `tests/chrome.spec.ts` covering the Map chrome scenarios:
  - `filters pill is inert on tap` → Scenario: Filters pill is inert
  - `bottom hint reflects renderable count` → Scenario: Bottom hint reflects renderable count and hides on selection
  - `bottom hint hides on selection` → Scenario: Bottom hint hides while a pin is selected
- [ ] 7.5 Add `tests/peek-card.spec.ts` covering Peek card content scenarios:
  - `header pairs monogram, name, locality` → Scenario: Header pairs monogram, name, and locality
  - `callout shows current-locale tagline` → Scenario: Callout renders current-locale tagline
  - `locality appends distance when geolocated` → Scenario: Locality line appends distance when geolocated
  - `pentagon renders nulls distinctly` → Scenario: Pentagon renders all five axes including nulls
  - `no close button; clears via Esc / outside / re-tap` → Scenario: No explicit close button
- [ ] 7.6 Add a casing assertion to one existing test covering the Visual design system scenarios:
  - `body copy renders lowercase` → Scenario: Body copy renders lowercase
  - `company name preserves source casing` → Scenario: Company name preserves source casing
  - `mono utility marks render uppercase with tracking` → Scenario: Mono utility marks render uppercase with tracking
