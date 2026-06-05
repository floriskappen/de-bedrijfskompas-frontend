## Why

A styling pass on the detail page and page transitions shipped behaviour that the specs no longer describe: the detail page now wears the peek card's surface, and the map's first-load reveal is deliberately suppressed when returning from the detail page. This change reconciles the specs with what ships.

## What Changes

- The company detail page background adopts the map peek card's warm grained surface (`--filter-surface` colour + paper-grain texture) so the peek card and the page it blooms into read as one continuous sheet.
- The map's initial paper-grain reveal is now scoped to genuine entries (first load, reload, direct/deep-link visit). It is SKIPPED when the map is reached via an in-app bloom transition (detail → map back-navigation), because the conceal curtain already bridges that cut. The bloom curtain sets a `sessionStorage` flag when its destination is a map route; the map page reads and clears it on load to decide whether to skip.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `company-detail`: add a requirement that the detail page background matches the peek card surface (warm grained sheet).
- `map-overview`: the "Initial map reveal" requirement is narrowed — the reveal plays on genuine entries but is skipped on in-app bloom return from the detail page.

## Impact

- Routes affected: `/` and `/en/` (map reveal), `/{company_id}/` and `/en/{company_id}/` (detail surface).
- Code: `src/lib/transitions/bloom-curtain.ts`, `src/components/MapPage.astro`, `src/styles/global.css`, `src/pages/[slug].astro`, `src/pages/en/[slug].astro`.
- No data-contract impact. Reduced-motion behaviour is unchanged (reveal already disabled under reduced motion).
