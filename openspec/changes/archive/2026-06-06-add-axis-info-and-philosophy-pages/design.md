## Context

The detail-page change fixed the axis info-page URLs (`/as/{axisId}/`, `/en/axis/{axisId}/`) as a forward reference. This change fills them in and adds the philosophy page they link to. Everything here is static, server-rendered prose plus the existing design tokens; the only interactive concern is the back button on the axis pages, which depends on how the visitor arrived. Axis content is authored copy, not pipeline data.

## Goals / Non-Goals

**Goals:**
- Five per-axis pages and one philosophy page, both locales, on the same warm-grain surface as the detail page.
- Plain, first-person, non-editorial prose (the user's explicit voice direction): no em dashes, no "not this, but that" constructions, claims hedged as opinion.
- Navigation between axes, back to the originating company, and to the philosophy page; the philosophy page surfaced from the map for new users.
- A consistent reveal transition on these reading pages.

**Non-Goals:**
- The filters-page link to the axis pages (lands with the filters-page rework).
- Favorites behaviour referenced in the philosophy copy (separate change).
- Any change to scoring, data, or the pipeline contract.

## Decisions

**Content lives in one module.** All axis + philosophy prose, section headings, footnotes, and the disclaimer sit in `src/lib/i18n/info-content.ts`, keyed by locale, so content passes touch one file and Dutch/English stay structurally parallel. Map/detail UI strings stay in `messages.ts`; only the map `about` label was added there. Alternative — MDX/content collections — rejected as overkill for a handful of short, bilingual, tightly-structured pages.

**Mostly static, one tiny script.** The pages are pure Astro with no client island. The only client code is a small inline script on the axis pages that reads `?from=` and rewrites the back link to the originating company (default: the map). Rationale: keep reading pages static; the origin is request-time state that can't be baked into a static page. `getAxisInfoHref(axis, locale, fromCompanyId?)` appends the param on the detail page.

**Footnotes as end-of-paragraph markers.** Contestable claims carry inline `[^id]` tokens parsed out of the prose and rendered as tiny numbered links ("1.") at the end of the paragraph, jumping to a notes list at the page bottom (with a back-link). Chosen over mid-sentence superscripts (the user found those cluttered) and over a separate per-claim aside. A paragraph can reference several notes.

**Standing disclaimer, hidden contact.** Every info page ends with one short line ("this is my own take, not an objective truth …") whose contact link is `mailto:` behind the words "neem gerust contact op" — the raw address never appears as visible text. This keeps the opinionated framing present everywhere without repeating a full caveat per claim.

**Directional bloom reveals.** Reading pages reuse the bloom-curtain printed-paper + wine/amber idiom but lift the cover along a line instead of opening from a point: a diagonal lower-left → upper-right sweep for axis pages, a top → bottom sweep for the philosophy page, with the flash centred so the bloom reads mid-screen. Implemented as CSS `mask-image` linear-gradient animations in `steps()`, auto-played on load, suppressed by the existing reduced-motion rule. No conceal-on-leave is added; the destination reveal is enough and stays consistent however the page is reached.

**Readability as a three-dot mark.** Each axis shows how readable it is (high/medium/low) as a filled-dot scale rather than reusing the evidence moons, since readability is a property of the axis, not of a company's evidence.

**Axis labels and glyphs reused.** Pages use the site labels (`getAxisLabel`) and the detail page's per-axis line glyphs, ported to `AxisGlyph.astro` so the static pages render them without hydration. The five axis IDs and their fixed order remain the load-bearing vocabulary.

## Risks / Trade-offs

- [`mask-image` gradient animation in `steps()`] → Renders in Chromium/WebKit; under reduced motion the curtain is hidden entirely, so the page still shows. Accepted; worth an eyeball in-browser.
- [Authored axis copy can drift from the actual scoring rubric over time] → The prose is hedged as opinion and the framework is called an evolving experiment; content is centralized for easy updates.
- [`power` axis may be removed later for lack of public signal] → Kept for now; its page states plainly that it's usually "unknown".
