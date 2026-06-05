## Why

Tapping a company on the map currently lands on a "coming soon" placeholder (`[slug].astro`). The data already carries everything a profile needs — per-axis scores, evidence levels, per-language reasoning, website — but none of it is shown. This is the first real destination in the app and the payoff for the whole map → peek-card flow.

## What Changes

- Replace the placeholder `[slug]` route (nl + en) with a real company detail page.
- Reuse the peek-card identity treatment (favicon/monogram, name, city · optional km, plain tagline) so the card and the page read as one object.
- Show the pentagon at the top, then a tappable list of the five axes; expanding a row reveals that axis's evidence level and the per-language `reason` prose.
- Each expanded axis links to its (future) axis info page via an icon/"wat betekent …?" row — a forward reference; the axis pages land in a later change.
- Surface a link to the company's website somewhere on the page.
- Axis names use the site's existing labels (inhoud, ecologie, macht, verankering, houding), not the design bundle's wording.

No data-contract change: all fields already exist on the `Company` record.

## Capabilities

### New Capabilities
- `company-detail`: the per-company profile route — identity header, pentagon, per-axis reasoning with evidence and info-page links, and a website link. Dutch at `/{id}/`, English at `/en/{id}/`.

### Modified Capabilities
<!-- none — no existing spec's requirements change -->

## Impact

- Routes: `src/pages/[slug].astro` and `src/pages/en/[slug].astro` (currently placeholders) become the detail page.
- New client island for the tappable axis list; reuses `Pentagon`, `getLocalizedField`, `getAxisLabel`, and the peek-card header styling.
- No change to the pipeline data contract.
