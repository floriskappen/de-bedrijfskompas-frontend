## Context

The peek card → detail → map journey is stitched together by the bloom curtain (`concealThenNavigate`): a conceal animation plays on the source page, then a full navigation loads the destination. The detail page plays its own `is-revealing` bloom on load. The map page, however, has always played the first-load paper-grain reveal on every load — including when returning from the detail page — which reads as a redundant second reveal. Separately, the detail page background used `bg-paper-warm`, a different colour from the peek card and without grain, so the card and the page it blooms into did not read as one sheet.

## Goals / Non-Goals

**Goals:**
- The detail page background visually continues the peek card surface.
- The map's first-load reveal plays only on genuine entries, and is skipped on in-app bloom return from the detail page, with no flash of either path.

**Non-Goals:**
- Reworking the bloom curtain motion itself (timings were tuned separately).
- Changing reduced-motion behaviour (the reveal is already disabled there).

## Decisions

**Shared warm-grain surface class.** The detail page reuses the peek card's surface (`--filter-surface` + `paper-grain-soft.svg` at 600px) via a small `.surface-warm-grain` utility rather than duplicating the background declaration inline. Alternative — pointing `bg-paper-warm` at the filter surface — was rejected because that token is used elsewhere and carries a different intent.

**sessionStorage flag for the reveal skip.** `concealThenNavigate` sets `bloom-nav` only when its destination resolves to a map route (`/` or `/en/`); the map page reads and clears it on load. Alternatives considered: `document.referrer` (unreliable, can be empty/stripped) and the Navigation Timing API (cannot distinguish a direct visit from an in-app navigation — both report `navigate`). Scoping the flag to map destinations means peek → detail never sets it, so there is no stale flag to leak.

**Decide before paint.** The flag is read by a synchronous `is:inline` script placed above the reveal surface in `MapPage.astro`, which toggles a `skip-map-reveal` class on `<html>`. CSS keys the cover's `::before`/`::after` off that class. Running before the surface paints avoids both a flash of the cover (skip path) and a flash of the bare map (reveal path).

## Risks / Trade-offs

- [sessionStorage unavailable / throws (private mode quirks)] → both the setter and reader are wrapped in try/catch; on failure the reveal simply plays, which is the safe default.
- [User reloads the detail page, then types a map URL] → the flag was never set (it is only set on a bloom navigation to a map route), so the reveal correctly plays.
