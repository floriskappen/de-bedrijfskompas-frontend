## 1. Content module

- [x] 1.1 Create `src/lib/i18n/info-content.ts`: per-axis `plain`/`meaning`/`counts`/`silence`/`footnotes`/`readability` and the philosophy `intro`/`sections`/`axesLead`/`tailSections`/`closing`, both locales, in the plain first-person voice.
- [x] 1.2 Add the shared section headings, readability phrases, axis eyebrow, and the standing disclaimer (text + hidden-email link).
- [x] 1.3 Add `parseInlineFootnotes` + `footnoteNumbers` and the accessors (`getAxisContent`, `getAxisSections`, `getAxisNumber`, `getPhilosophyContent`, `getInfoDisclaimer`).

## 2. Shared components

- [x] 2.1 `AxisGlyph.astro` — the per-axis line glyph, ported from the detail page for static rendering.
- [x] 2.2 `ProseP.astro` — a paragraph that pulls `[^id]` markers out of the sentence and renders them as tiny "1." links at the paragraph end.
- [x] 2.3 `Footnotes.astro` — the numbered notes list with anchors and back-links.
- [x] 2.4 `Disclaimer.astro` — the standing disclaimer line with the `mailto:` behind link text.

## 3. Axis info pages

- [x] 3.1 `AxisInfo.astro`: eyebrow ("as N van 5"), glyph + label, plain lead, the three prose sections (with footnotes), readability three-dot mark, "the other axes" list, inline link to the philosophy page, footnotes, disclaimer.
- [x] 3.2 Back button: defaults to the map; inline script rewrites it to `/{from}/` (or `/en/{from}/`) when `?from=` is present, and relabels it.
- [x] 3.3 Add the diagonal `is-revealing-sweep` bloom curtain.
- [x] 3.4 Routes `src/pages/as/[axis].astro` (nl) and `src/pages/en/axis/[axis].astro` (en) with `getStaticPaths` over `AXIS_IDS` and unknown→404.

## 4. Philosophy / about page

- [x] 4.1 `Philosophy.astro`: title + intro, the explanatory sections, the five-axes list (each linking to its info page, grouped with a single border), the tail "about the site" section, the closing experiment note, the disclaimer.
- [x] 4.2 Add the top-to-bottom `is-revealing-down` bloom curtain.
- [x] 4.3 Routes `src/pages/over.astro` (nl) and `src/pages/en/about.astro` (en).

## 5. Wiring into existing surfaces

- [x] 5.1 `getAxisInfoHref(axis, locale, fromCompanyId?)` appends `?from=`; `CompanyDetail.tsx` passes the company id.
- [x] 5.2 `MapView.tsx`: add the icon-only philosophy/"why this site" button in the top-left chrome, linking to `/over/` (nl) or `/en/about/` (en); add the `about` label to `messages.ts`.
- [x] 5.3 `global.css`: footnote-marker styling + the two directional bloom-sweep reveals (suppressed under reduced motion).

## 6. Verify

- [x] 6.1 `npm run build` generates all 12 pages (5 nl axes, 5 en axes, `/over/`, `/en/about/`); `npm run test` passes (46 tests).
- [x] 6.2 Spot-check the detail → axis (`?from=`) → back loop returns to the company; the map about button opens the philosophy page; footnote markers and the hidden-email disclaimer render; lowercase copy, single accent, no blur hold.
