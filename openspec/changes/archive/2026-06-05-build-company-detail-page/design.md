## Context

The map → peek-card flow already navigates to `/{id}/` (and `/en/{id}/`), but both routes are "coming soon" placeholders. The `Company` record already carries the numeric scores + evidence per axis (`scores[axis]`), the per-language `reason` prose (`nl/en.scores[axis].reason`), `tagline`, `website`, `favicon_url`, and `address.city`. So this is a presentation change, not a data change. A hi-fi design bundle (`Detail Hi-Fi.html` / `detail-hifi.jsx`) defines the look; we adapt it to the site's tokens, axis labels, and lowercase copy.

## Goals / Non-Goals

**Goals:**
- A static, server-rendered detail page per company, in both locales.
- Identity header that visually matches the peek card (one shared object across card and page).
- Pentagon + tappable per-axis list showing evidence level and the `reason` prose.
- A forward-referenced link per axis to its future info page; a website link somewhere on the page.

**Non-Goals:**
- Building the axis info pages themselves (separate change) — we only link to their eventual URLs.
- Favorites/bookmark behaviour and the overflow menu from the design (separate favorites change).
- A language switcher on this page (locale is fixed by route prefix; switcher comes later).
- Showing employee count / "last checked" date / per-axis source URL — not in the data contract.

## Decisions

**Island boundary.** The axis list is the only interactive part (rows expand/collapse), so the page is a static Astro route that mounts one client island (`CompanyDetail`, `client:load`) rendering header + pentagon + axis list. Rationale: keep the page mostly static HTML; one island matches the existing `PeekCard`/`MapView` pattern. Alternative — native `<details>` accordion with zero JS — rejected to keep the expand animation and visual parity with the design's React rows.

**Reuse, don't re-style, the header.** The favicon/monogram block, name, `city · km`, and plain tagline paragraph are ported verbatim from `PeekCard` so card and page stay identical. The design bundle's "IN HET ECHT" accent callout is intentionally dropped in favor of the peek-card's plain inline tagline (per product direction).

**Axis labels from the site, not the bundle.** Use `getAxisLabel()` (inhoud, ecologie, macht, verankering, houding) rather than the bundle's substantie/inbedding. The five axis IDs and their fixed order are the load-bearing vocabulary (see spec).

**Evidence presentation.** Map `evidence` (`well_evidenced` / `partial` / `no_signal`) to the moon-glyph + lowercase word treatment from the bundle. A `no_signal` / `null`-score axis is a first-class state: greyed row, `?` in the pentagon (Pentagon already does this), and the `reason` still shown if present.

**Axis info-page link target.** Each expanded axis links to `/as/{axisId}/` (nl) and `/en/axis/{axisId}/` (en), using the language-neutral axis ID. These routes 404 until the axis-info-pages change lands; that's an accepted forward reference, and fixing the URL now keeps the later change mechanical.

**i18n.** `reason` and `tagline` come through `getLocalizedField` (primary locale, fallback to the other). Axis labels and all chrome copy come from the existing label/message helpers. Locale is derived from the route, not stored.

## Risks / Trade-offs

- [Axis info links 404 until the next change] → Acceptable per TODO ordering; the URL contract is fixed here so the later change is drop-in.
- [`reason` text could be empty for some axis/locale] → Fall back across locales via `getLocalizedField`; if still empty, render the row without prose (evidence + label only) rather than an empty block.
- [Distance (km) needs the user's geolocation, which the standalone page lacks] → Show `city` only when no location is available; km is explicitly optional in the design.
