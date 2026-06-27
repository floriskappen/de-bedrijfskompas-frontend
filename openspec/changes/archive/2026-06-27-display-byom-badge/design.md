## Context

The app consumes the BYOM constitution as a pinned `vendor/byom` submodule (currently `v1.1.0`). v1.2.0 is a badge-focused release: the mark is redesigned as two overlapping squares and a themeable inline bare mark (`byom-mark-currentColor.svg`) is added. `docs/BYOM-INTEGRATION.md` records "displaying the badge" as a deferred follow-on — the v0.1.0 blockers (decided link target `https://byom.flkp.nl/`; badge/registry contracts moved out of `website/` into `constitution/badge/`) were resolved in v1.0.0, so displaying the canonical badge is now conformant and unblocked. The app is single-theme light (cream/paper, no `prefers-color-scheme`); user-facing copy is lowercase (mono utility marks the only uppercase exception). The strict CSP uses `default-src 'self'` with no `img-src` override, so images may only load from `'self'`.

## Goals / Non-Goals

**Goals:**
- Advance the submodule pin to v1.2.0 and re-walk the v1.1.0→v1.2.0 changelog slice.
- Display the smallest canonical badge (96×26, light) on the about page, CSP-safe, with the honest-claim text.
- Display the bare themeable mark inside the BYOK connection-management surface.
- Close the badge-display deviation; keep the registry-listing deviation (blocked on externals).

**Non-Goals:**
- A global footer or app-wide badge placement (would add chrome to the key-holding map view).
- Dark-mode badge variants (no dark theme exists).
- The upstream registry listing (requires a deployed app URL + public source URL this change does not create).
- Touching the pipeline data contract or the BYOK request/key/CSP invariants.

## Decisions

### D1. Self-host the canonical badge SVG and `<img>`-embed it
Embed the small light badge via `<img src="/assets/byom/byom-badge-light-small.svg">` from the app's own origin, copying the identical SVG bytes from `vendor/byom/website/public/assets/badge/` into `public/assets/byom/`. **Why:** the strict CSP (`default-src 'self'`, no `img-src`) blocks a remote `https://byom.flkp.nl/...` `<img>`, and the badge README prescribes `<img>` embedding — an `<img>`-loaded SVG is an isolated document that cannot read host `currentColor`/CSS vars, which is exactly what keeps the badge canonical (un-themeable, looks the same across apps). Self-hosting preserves the identical bytes (canonical look) and keeps `img-src` at `'self'` (invariant 3 unchanged). **Alternatives:** (a) add `https://byom.flkp.nl` to `img-src` — widens the CSP for one asset, needs invariant-3 justification, and couples display to an external origin's uptime; (b) inline the badge SVG markup into the DOM — avoids `img-src` but the README explicitly says the badge is shipped for `<img>` embedding and warns against inlining it (inlining risks recolouring and breaks the recognition guarantee). Rejected.

### D2. Bare mark: inline `byom-mark-currentColor.svg` as a foot link with a "BYOM" wordmark
Inline the bare mark's SVG markup at the foot of the `ByokSetupDialog` (not in the header, where it would read as a logo), alongside a small mono "BYOM" wordmark, and wrap both in a link to `https://byom.flkp.nl/`. The mark inherits `currentColor` (the app ink). **Why:** the README's "Theming the inline mark" section is written for exactly this case — the bare mark used inline in an app's own chrome is a lightweight "BYOM-powered" affordance, and matching the host theme is reasonable; `currentColor` is one file, works in the light theme, and preserves the two-square read via the app square drawn at half opacity. Placing it at the foot (not the header) keeps it subtle and avoids implying it is the surface's logo; linking it to the pattern site gives a "learn more" affordance without overclaiming safety (it is still not the canonical badge). **Alternatives:** (a) header placement — reads as the surface's logo; rejected; (b) the two-CSS-variable variant — fuller two-tone, but overkill for a single-theme app and `currentColor` already preserves the read; (c) `<img>` the bare mark — loses theming and the README says inlining is the prescribed path. Rejected.

### D3. Placement: canonical badge on the about page; bare mark as a foot link in the BYOK connection surface
**Why:** the about page (`/over/`, `/en/about/`) is where the app explains itself, and the README lists "about page" as a canonical badge home; it is a static page with no key surface (lowest risk). The bare mark belongs inside the BYOM surface itself (where the visitor manages key/spend) — the most semantically apt spot, matching the README's "inside an app's own chrome" framing, placed at the foot so it stays subtle. Badge/mark placement requirements are owned by the new `byom-badge` spec; `bring-your-own-key-llm` needs no spec edit. (`philosophy-page` is modified only to drop the removed closing note — D7.)

### D4. Light variant only
Ship only the light badge; the bare mark is `currentColor` (theme-neutral). **Why:** the app has a single light theme. **Alternative:** ship both + a `prefers-color-scheme` swap — adds complexity for a theme that does not exist. Rejected.

### D5. Honest claim travels in the canonical alt text, not visible prose
The honest claim ("follows the pattern and invariants, not proof of safety") is carried by the badge `<img>`'s canonical `alt` text, not by a visible prose paragraph on the about page. **Why:** the README's "restate near the badge" is guidance, not an invariant; the canonical alt text already carries the full honest claim (for assistive tech), and the badge links to `https://byom.flkp.nl/` where the pattern and its limits are explained. Keeping the visible presence to just the badge respects the app's lean, subtle aesthetic. **Alternative:** a visible lowercase nl/en prose restatement — adds translatable surface area and visual weight the app avoids; rejected. This is a deliberate, recorded choice from the README's "restate near" guidance, not a deviation from any security invariant.

### D6. Close the badge deviation; keep the registry-listing deviation
The badge is now conformant to display → close the badge-display deviation. The upstream registry listing stays a recorded deviation: `registry.yaml` requires a live `https` app `url` and a public `https` `source_url`, neither of which this change creates. These are entry conditions for a follow-on, not conformance gaps.

### D7. Remove the about page's closing "evolving experiment" note
The closing note ("dit is een experiment...") is removed so the about page ends cleanly at the badge + disclaimer. **Why:** the page already conveys its evolving nature through its first-person tone; the closing line is redundant with the badge's "not proof of safety" stance and the disclaimer. Modifies the `philosophy-page` "Content structure" requirement (drops the closing note from the ordered content list).

## Risks / Trade-offs

- **Self-hosted badge drifts from upstream look on a future pin advance** → the badge README pins served paths/filenames as a long-lived contract ("evolve by adding files, not repurposing paths"), so `byom-badge-light-small.svg` is stable; the `byom-consumption` "Constitution update process" requirement already re-walks changelog slices on a pin bump, and the propagation-log entry will note re-syncing hosted badge assets. Low risk.
- **Bare mark inlined in a key-handling React component** → the mark is pure presentational SVG (no handlers, state, or network), so it cannot interfere with the leave-guard, CSP, or in-memory-key posture. Zero behavioural risk.
- **Hardcoded `v1.2.0` in the spec scenario and test** → must be bumped again on the next pin advance. This matches the established `v1.1.0` pattern (spec + `byom-consumption.test.ts` move together); acceptable, recorded by the propagation log.
