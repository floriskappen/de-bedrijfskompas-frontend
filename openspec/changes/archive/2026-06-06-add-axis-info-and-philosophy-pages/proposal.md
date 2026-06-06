## Why

The company detail page already links each axis to `/as/{axisId}/` (nl) and `/en/axis/{axisId}/` (en), but those routes 404 — a forward reference left by the detail-page change. There is also no place that explains, in plain language, what the five axes mean or why the site judges companies the way it does. New visitors land on a map of scores with no context for the worldview behind them. This change ships both: the per-axis explanation pages and the philosophy / about page they point back to.

## What Changes

- Add five per-axis info pages (one route family, both locales): nl `/as/{axisId}/`, en `/en/axis/{axisId}/`. Each explains the axis in plain, first-person prose — what it means, what pushes a company up or down, and how silence is read — plus a small readability indicator, links to the other four axes, and a link to the philosophy page. Contestable claims carry tiny numbered footnotes that resolve at the bottom of the page.
- Add the philosophy / about page: nl `/over/`, en `/en/about/`. It tells the project's story (why vacancy-first is backwards, slow discovery, honest descriptions, the five subjective axes, why where you work matters, public-data-only, "unknown" instead of guessing, a note about the static no-tracking site), ending with the five-axes list and a standing disclaimer.
- Surface the philosophy page from the map: an icon-only "why this site" button in the top-left map chrome (mirroring the top-right filters button), for new users.
- The detail page's axis links now carry `?from={company_id}` so the info page's back button returns to the company you came from; without it, back goes to the map.
- Both page families play a directional paper-bloom reveal on load (axis pages: diagonal lower-left → upper-right; philosophy: top → bottom), in the existing bloom-curtain idiom, suppressed under reduced motion.

No data-contract change: axis content is authored copy in the frontend (`info-content.ts`), not pipeline data.

## Capabilities

### New Capabilities
- `axis-info-pages`: the five per-axis explanation pages (both locales), their structure, navigation, footnotes, readability mark, and reveal transition.
- `philosophy-page`: the about/philosophy route (both locales), its content structure, the five-axes list, the standing disclaimer, and its reveal transition.

### Modified Capabilities
- `company-detail`: the axis info-page link now carries the originating `company_id` as `?from=` so the info page can return to it.
- `map-overview`: the map chrome adds an icon-only philosophy/"why this site" entry button in the top-left, alongside the existing top-right filters button.

## Impact

- New routes: `src/pages/as/[axis].astro`, `src/pages/en/axis/[axis].astro`, `src/pages/over.astro`, `src/pages/en/about.astro`.
- New components: `AxisInfo.astro`, `Philosophy.astro`, `AxisGlyph.astro`, `ProseP.astro`, `Footnotes.astro`, `Disclaimer.astro`.
- New content/helpers: `src/lib/i18n/info-content.ts` (axis + philosophy prose, footnotes, disclaimer).
- Touched: `src/components/CompanyDetail.tsx` and `axis-detail.ts` (`getAxisInfoHref` gains an optional `fromCompanyId`), `src/components/MapView.tsx` (about button), `src/lib/i18n/messages.ts` (`about` label), `src/styles/global.css` (footnote marker + two directional bloom-sweep reveals).
- No change to the pipeline data contract.
