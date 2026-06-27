## Why

BYOM v1.2.0 redesigns the badge mark and adds a themeable inline bare mark; `docs/BYOM-INTEGRATION.md` records "displaying the badge" as a deferred follow-on (the v0.1.0 blockers — decided link target, badge/registry contracts moved out of `website/` into `constitution/badge/` — were resolved in v1.0.0). This change advances the submodule pin to v1.2.0 and displays the smallest badge: the canonical small badge on the about page, plus the bare themeable mark inside the BYOK connection surface. Why now: the badge release is cut and conformant to display.

## What Changes

- Advance the `vendor/byom` submodule pin from `v1.1.0` → `v1.2.0` (commit `468b47d` → `a531d35`); re-walk the v1.1.0→v1.2.0 changelog slice (badge-mark redesign + themeable inline mark; no invariant/contract/schema change).
- Display the **canonical small badge** (96×26, light) on the philosophy / about page (`/over/`, `/en/about/`): self-hosted SVG `<img>`, linked to `https://byom.flkp.nl/` with `rel="noopener"`, carrying the canonical `alt` text ("follows the pattern and invariants, not proof of safety"). The honest claim travels in the alt text, not as visible prose, to keep the presence subtle.
- Display the **bare themeable mark** (24×24, `currentColor`) at the foot of the BYOK connection-management surface alongside a "BYOM" wordmark, together linking to `https://byom.flkp.nl/` — a small subtle "BYOM-powered" affordance, not the canonical badge.
- Remove the about page's closing "evolving experiment" note so the page ends cleanly at the badge + disclaimer.
- Close the badge-display deviation in `docs/BYOM-INTEGRATION.md`; record the v1.1.0→v1.2.0 propagation-log entry. The upstream **registry listing** remains blocked on externals (live app URL; public source URL) and stays a recorded deviation.
- Update the `byom-consumption` conformance test's pinned version/SHA/propagation-log assertions to v1.2.0.

## Capabilities

### New Capabilities
- `byom-badge`: displaying the BYOM badge and bare mark in this app — canonical badge embed rules (self-hosted `<img>`, canonical alt carrying the honest claim, link target, light-only), the bare inline mark (`currentColor`, themeable), and their placements (canonical badge on the about page; bare mark + "BYOM" wordmark as a foot link in the BYOK connection surface).

### Modified Capabilities
- `byom-consumption`: the pinned constitution version advances `v1.1.0` → `v1.2.0` (the "exact release" and "integration document records the current pin" scenarios), with the v1.1.0→v1.2.0 propagation logged and the badge-display deviation closed.
- `philosophy-page`: the "Content structure" requirement drops the closing "evolving experiment" note (removed from the about page); the BYOM badge placement itself is owned by the new `byom-badge` capability.

## Impact

Routes: `/over/` and `/en/about/` gain the canonical badge (and lose the closing experiment note); the BYOK connection-management surface (a same-page full-screen view, not a route) gains the foot BYOM link. Shared capabilities touched: `byom-consumption` (pin), `philosophy-page` (drops the closing note; hosts the badge, but the placement requirement is owned by the new `byom-badge` spec), `bring-your-own-key-llm` (hosts the foot mark, owned by `byom-badge`). Code: `vendor/byom` submodule bump; a self-hosted badge SVG under `public/assets/byom/`; `src/components/Philosophy.astro`; `src/components/ByokSetupDialog.tsx`; `src/lib/i18n/info-content.ts` (removes the now-unused closing/claim fields); `docs/BYOM-INTEGRATION.md`; `src/lib/byom/byom-consumption.test.ts`. CSP: the badge is self-hosted and `<img>`-embedded so `img-src` stays `'self'` (invariant 3 unchanged); the bare mark is inlined DOM markup (no `img-src`, no new origin). No new third-party JS (invariant 4 unchanged). **The data contract with the pipeline is not touched.**
